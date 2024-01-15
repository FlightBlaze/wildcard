const wlib = require('./wildcardlib');

const color = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  
  fg: {
      black: "\x1b[30m",
      red: "\x1b[31m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m",
      magenta: "\x1b[35m",
      cyan: "\x1b[36m",
      white: "\x1b[37m",
      gray: "\x1b[90m",
      crimson: "\x1b[38m"
  },
  bg: {
      black: "\x1b[40m",
      red: "\x1b[41m",
      green: "\x1b[42m",
      yellow: "\x1b[43m",
      blue: "\x1b[44m",
      magenta: "\x1b[45m",
      cyan: "\x1b[46m",
      white: "\x1b[47m",
      gray: "\x1b[100m",
      crimson: "\x1b[48m"
  }
};

if (process.argv.length === 2) {
  [
    '',
    `${color.fg.blue}Possible commands${color.reset}`,
    '',
    ` • wildcard serve ${color.fg.green}./path/to/sources${color.reset}          ${color.fg.gray}— start the language server and run the application${color.reset}`,
    ` • wildcard build debug ${color.fg.green}./path/to/sources${color.reset}    ${color.fg.gray}— compile the application in debug mode${color.reset}`,
    ` • wildcard build release ${color.fg.green}./path/to/sources${color.reset}  ${color.fg.gray}— compile the application for production${color.reset}`,
    ` • wildcard run ${color.fg.green}./path/to/application${color.reset}        ${color.fg.gray}— run the application${color.reset}`,
    ` • wildcard eval ${color.fg.green}expression${color.reset}                  ${color.fg.gray}— evaluate the expression${color.reset}`,
    '',
    `${color.fg.gray}(*) wildcard, version 1.0β${color.reset}`,
    ''
  ].forEach((item) => console.log(item));
  process.exit(0);
}

const checkArgumentCount = (funcName, argCount, actualArgumentCount) => {
  if (argCount === actualArgumentCount - 2) {
    return;
  }
  console.log(`${color.fg.red}Not enough arguments for ${color.fg.magenta}${funcName}${color.fg.red}. Expected ${color.fg.magenta}${argCount}${color.fg.red} arguments, got ${color.fg.magenta}${actualArgumentCount - 2}${color.reset}`);
  process.exit(1);
}

if (process.argv[2] ==='serve') {
  checkArgumentCount('serve', 2, process.argv.length);
  const path = process.argv[2];
  console.log(`Serving from ${path}`);
  return;
}

if (process.argv[2] === 'eval') {
  let expression = process.argv.slice(3).join(' ');
  if (expression.startsWith('"')) {
    expression = expression.slice(1, -1);
  }
  expression = `print(${expression})`;
  try {
    wlib.evaluate(wlib.compile(expression), wlib.globalStore);
  } catch (e) {
    if (!e.message === 'syntax' && !e.message === 'runtime') {
      throw e;
    }
  }
  return;
}

console.log(`${color.fg.red}No such command as ${color.fg.magenta}${process.argv[2]}${color.reset}`);
process.exit(1);
