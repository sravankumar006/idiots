export const handleCopy = (text: string, onCopied?: () => void): Promise<boolean> => {
  return navigator.clipboard.writeText(text)
    .then(() => {
      if (onCopied) onCopied()
      return true
    })
    .catch((err) => {
      console.error('Could not copy text: ', err)
      return false
    })
}
