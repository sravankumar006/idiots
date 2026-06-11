import re

with open(r'C:\Users\SAMSUNG\OneDrive\Desktop\My-Projects\idiots\app\(platform)\space\[username]\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replacements
replacements = [
    (r"bg-gradient-to-b from-[#0b0c15] via-[#111324] to-[#07080f]", r"bg-gradient-to-b from-slate-50 via-sky-50 to-white dark:from-[#0b0c15] dark:via-[#111324] dark:to-[#07080f]"),
    (r"bg-gradient-to-b from-[#1c1815] via-[#241e1a] to-[#141210]", r"bg-gradient-to-b from-orange-50 via-amber-50 to-white dark:from-[#1c1815] dark:via-[#241e1a] dark:to-[#141210]"),
    (r"bg-gradient-to-b from-[#0f121d] via-[#181d2f] to-[#0c0e17]", r"bg-gradient-to-b from-slate-100 via-blue-50 to-white dark:from-[#0f121d] dark:via-[#181d2f] dark:to-[#0c0e17]"),
    (r"bg-gradient-to-b from-[#0a1410] via-[#10221a] to-[#060c09]", r"bg-gradient-to-b from-emerald-50 via-teal-50 to-white dark:from-[#0a1410] dark:via-[#10221a] dark:to-[#060c09]"),
    (r"bg-gradient-to-b from-[#1b0d21] via-[#2f132e] to-[#120716]", r"bg-gradient-to-b from-rose-50 via-orange-50 to-white dark:from-[#1b0d21] dark:via-[#2f132e] dark:to-[#120716]"),
    
    (r"text: 'text-violet-400', bg: 'bg-violet-500/10', button: 'bg-violet-600 hover:bg-violet-500'", r"text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10', button: 'bg-violet-600 hover:bg-violet-500'"),
    (r"text: 'text-emerald-400', bg: 'bg-emerald-500/10', button: 'bg-emerald-600 hover:bg-emerald-500'", r"text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', button: 'bg-emerald-600 hover:bg-emerald-500'"),
    (r"text: 'text-rose-400', bg: 'bg-rose-500/10', button: 'bg-rose-600 hover:bg-rose-500'", r"text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', button: 'bg-rose-600 hover:bg-rose-500'"),
    (r"text: 'text-amber-400', bg: 'bg-amber-500/10', button: 'bg-amber-600 hover:bg-amber-500'", r"text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', button: 'bg-amber-600 hover:bg-amber-500'"),
    (r"text: 'text-sky-400', bg: 'bg-sky-500/10', button: 'bg-sky-600 hover:bg-sky-500'", r"text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10', button: 'bg-sky-600 hover:bg-sky-500'"),

    # Cards and Borders
    (r"bg-black/25 border-white/5", r"bg-white/60 dark:bg-black/25 border-black/5 dark:border-white/5 shadow-sm dark:shadow-none"),
    (r"bg-white/2 border border-white/5", r"bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm dark:shadow-none"),
    (r"bg-white/3 border border-white/5", r"bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/5"),
    (r"bg-white/5 border border-white/10", r"bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10"),
    (r"bg-[#141520] border border-white/10", r"bg-white dark:bg-[#141520] border border-black/10 dark:border-white/10"),
    (r"bg-white/5 hover:bg-white/10", r"bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"),
    (r"bg-[#141520]", r"bg-white dark:bg-[#141520]"),
    
    # Text colors
    (r"text-white", r"text-gray-900 dark:text-white"),
    (r"text-gray-200", r"text-gray-800 dark:text-gray-200"),
    (r"text-gray-300", r"text-gray-700 dark:text-gray-300"),
    (r"text-gray-400", r"text-gray-500 dark:text-gray-400"),
    
    # SVG node background
    (r"fill=\"#141520\"", r"fill=\"currentColor\" className=\"text-white dark:text-[#141520]\""),
    
    (r"border-white/10 text-violet-500", r"border-black/10 dark:border-white/10 text-violet-500"),
]

for old, new in replacements:
    content = content.replace(old, new)

# Fix incorrectly replaced text inside specific things
content = content.replace('shadow-[0_0_8px_text-gray-900 dark:text-white]', 'shadow-[0_0_8px_white]')
content = content.replace('shadow-[0_0_12px_text-gray-900 dark:text-white]', 'shadow-[0_0_12px_white]')
content = content.replace('shadow-[0_0_6px_text-gray-900 dark:text-white]', 'shadow-[0_0_6px_white]')
content = content.replace('bg-text-gray-900 dark:text-white', 'bg-white')

with open(r'C:\Users\SAMSUNG\OneDrive\Desktop\My-Projects\idiots\app\(platform)\space\[username]\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
