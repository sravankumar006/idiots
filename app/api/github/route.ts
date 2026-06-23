import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CACHE_DURATION_MS = 2 * 60 * 60 * 1000 // Cache for 2 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const repoUrl = searchParams.get('repoUrl')
  
  const supabase = await createClient()

  if (username) {
    const cleanUsername = username.trim().toLowerCase()
    const key = `user:${cleanUsername}`
    
    // 1. Check database cache
    const { data: cached } = await supabase
      .from('github_cache')
      .select('*')
      .eq('key', key)
      .maybeSingle()

    const now = Date.now()
    if (cached && (now - new Date(cached.updated_at).getTime() < CACHE_DURATION_MS)) {
      return NextResponse.json(cached.data)
    }

    // 2. Fetch fresh data from GitHub REST API
    try {
      const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'idiots-developer-identity-app'
      }
      if (token) {
        headers['Authorization'] = `token ${token}`
      }

      // Fetch user profile
      const userRes = await fetch(`https://api.github.com/users/${username}`, { headers })
      if (userRes.status === 404) {
        return NextResponse.json({ error: 'GitHub user not found', code: 'not_found' }, { status: 404 })
      }
      if (!userRes.ok) {
        throw new Error(`GitHub API profile fetch error: ${userRes.statusText}`)
      }
      const profile = await userRes.json()

      // Fetch user repos
      const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers })
      if (!reposRes.ok) {
        throw new Error(`GitHub API repos fetch error: ${reposRes.statusText}`)
      }
      const repos = await reposRes.json()

      // Process activity metrics
      let totalStars = 0
      const languages: Record<string, number> = {}
      
      repos.forEach((repo: any) => {
        totalStars += repo.stargazers_count || 0
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1
        }
      })

      // Sort languages to get Top Languages
      const topLanguages = Object.entries(languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lang]) => lang)

      // Most recently updated
      const recentRepos = repos
        .slice(0, 5)
        .map((repo: any) => ({
          name: repo.name,
          url: repo.html_url,
          description: repo.description,
          stars: repo.stargazers_count,
          language: repo.language,
          pushed_at: repo.pushed_at,
          updated_at: repo.updated_at
        }))

      // Fetch public GitHub events (max 30)
      let githubActivities: any[] = []
      try {
        const eventsRes = await fetch(`https://api.github.com/users/${username}/events/public?per_page=30`, { headers })
        if (eventsRes.ok) {
          const events = await eventsRes.json()
          if (Array.isArray(events)) {
            githubActivities = events
              .map((evt: any) => {
                if (evt.type === 'CreateEvent' && evt.payload?.ref_type === 'repository') {
                  const repoCleanName = evt.repo?.name ? evt.repo.name.split('/').pop() : 'unknown repo'
                  return {
                    id: evt.id,
                    activity_type: 'github_repo_new',
                    description: `Created new repository: ${repoCleanName}`,
                    created_at: evt.created_at
                  }
                }
                if (evt.type === 'PushEvent') {
                  const commitCount = evt.payload?.commits?.length || 1
                  const commitStr = commitCount === 1 ? 'commit' : 'commits'
                  const repoCleanName = evt.repo?.name ? evt.repo.name.split('/').pop() : 'unknown repo'
                  return {
                    id: evt.id,
                    activity_type: 'github_repo_update',
                    description: `Pushed ${commitCount} ${commitStr} to repository: ${repoCleanName}`,
                    created_at: evt.created_at
                  }
                }
                return null
              })
              .filter(Boolean)
          }
        }
      } catch (e) {
        console.warn("Failed to fetch public GitHub events", e)
      }

      const payload = {
        profile: {
          avatar_url: profile.avatar_url,
          name: profile.name || profile.login,
          bio: profile.bio || '',
          followers: profile.followers,
          following: profile.following,
          public_repos: profile.public_repos
        },
        activity: {
          total_repos: profile.public_repos,
          total_stars: totalStars,
          recent_repos: recentRepos,
          top_languages: topLanguages,
          github_activities: githubActivities
        }
      }

      // Update cache in database
      await supabase.from('github_cache').upsert({
        key,
        data: payload,
        updated_at: new Date().toISOString()
      })

      return NextResponse.json(payload)
    } catch (err: any) {
      console.error("[GitHub API Server Error]", err)
      // Fallback: If GitHub API is down, use stale cached database record
      if (cached) {
        return NextResponse.json(cached.data)
      }
      return NextResponse.json({ error: 'GitHub API is currently unavailable', code: 'api_unavailable' }, { status: 503 })
    }
  }

  if (repoUrl) {
    const cleanRepoUrl = repoUrl.trim()
    // Parse owner and repo name from github URL
    const match = cleanRepoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid GitHub repository URL', code: 'invalid_url' }, { status: 400 })
    }
    const owner = match[1]
    const repo = match[2].replace(/\.git$/, '') // strip any trailing .git
    const key = `repo:${owner.toLowerCase()}/${repo.toLowerCase()}`

    // 1. Check database cache
    const { data: cached } = await supabase
      .from('github_cache')
      .select('*')
      .eq('key', key)
      .maybeSingle()

    const now = Date.now()
    if (cached && (now - new Date(cached.updated_at).getTime() < CACHE_DURATION_MS)) {
      return NextResponse.json(cached.data)
    }

    // 2. Fetch fresh repo details
    try {
      const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'idiots-developer-identity-app'
      }
      if (token) {
        headers['Authorization'] = `token ${token}`
      }

      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })
      if (repoRes.status === 404) {
        return NextResponse.json({ error: 'Repository not found', code: 'not_found' }, { status: 404 })
      }
      if (!repoRes.ok) {
        throw new Error(`GitHub API repo fetch error: ${repoRes.statusText}`)
      }
      const data = await repoRes.json()

      const payload = {
        name: data.name,
        full_name: data.full_name,
        archived: data.archived,
        private: data.private,
        stargazers_count: data.stargazers_count,
        open_issues_count: data.open_issues_count,
        pushed_at: data.pushed_at,
        html_url: data.html_url
      }

      // Update database cache
      await supabase.from('github_cache').upsert({
        key,
        data: payload,
        updated_at: new Date().toISOString()
      })

      return NextResponse.json(payload)
    } catch (err: any) {
      console.error("[GitHub API Repo Server Error]", err)
      // Fallback: If API fails, return cached record
      if (cached) {
        return NextResponse.json(cached.data)
      }
      return NextResponse.json({ error: 'GitHub API is currently unavailable', code: 'api_unavailable' }, { status: 503 })
    }
  }

  return NextResponse.json({ error: 'Missing parameter: username or repoUrl' }, { status: 400 })
}
