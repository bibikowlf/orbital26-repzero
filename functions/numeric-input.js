export const handleNumericInput = (text) => {
  const cleanedValue = text.replace(/[^0-9]/g, '')
  const parsedValue = parseInt(cleanedValue, 10)

  return isNaN(parsedValue) ? 0 : parsedValue
}