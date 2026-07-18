export const cleanString = (s) => {
  return s.toLowerCase().replace(/[^a-z]/g, '')
}