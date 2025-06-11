export async function prompt(message: string): Promise<string> {
  console.log(message);
  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  if (n === null) return "";
  return new TextDecoder().decode(buf.subarray(0, n)).trim();
}

export async function confirm(message: string, defaultValue = false): Promise<boolean> {
  const suffix = defaultValue ? " [Y/n]: " : " [y/N]: ";
  const answer = await prompt(message + suffix);

  if (answer === "") return defaultValue;

  const normalized = answer.toLowerCase();
  return normalized === "y" || normalized === "yes";
}

export async function select<T>(
  message: string,
  options: Array<{ value: T; label: string }>,
  defaultIndex = 0,
): Promise<T> {
  console.log(message);
  console.log();

  options.forEach((option, index) => {
    const marker = index === defaultIndex ? ">" : " ";
    console.log(`${marker} ${index + 1}. ${option.label}`);
  });

  console.log();
  const answer = await prompt(`Enter number (1-${options.length}) [${defaultIndex + 1}]: `);

  if (answer === "") {
    return options[defaultIndex].value;
  }

  const index = parseInt(answer) - 1;
  if (isNaN(index) || index < 0 || index >= options.length) {
    console.error("Invalid selection. Using default.");
    return options[defaultIndex].value;
  }

  return options[index].value;
}
