export function replacePlaceholders(str, values) {
  return Object.keys(values).reduce((currentStr, key) => {
    const placeholder = `\\$\\{${key}\\}`;
    return currentStr.replace(new RegExp(placeholder, "g"), values[key]);
  }, str);
}
