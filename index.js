const wlib = require('./wildcardlib');
const fs = require('fs');

function bundle(path, verbose=true) {
  const functions = [];
  let entryPointContents = '';
  let hasIndexFile = false;
  fs.readdirSync(path).forEach(file => {
    if (!file.endsWith('.w')) {
      return;
    }
    if (verbose) {
      console.log(file);
    }
    if (file === 'index.w') {
      entryPointContents = fs.readFileSync(path + '/' + file, 'utf8');
      hasIndexFile = true;
    } else {
      const fnName = file.replace('.w', '');
      functions.push({name: fnName, body: '__filename_'+fnName+'\n'+fs.readFileSync(path + '/' + file, 'utf8')});
    }
  });
  if (!hasIndexFile) {
    console.error('Bundle Error: No index.w file found');
    process.exit(1);
  }
  entryPointContents = functions.map(f => `${f.name}=[${f.body}]\n`).join('') + '__filename_index\n' + entryPointContents;
  return wlib.compile(entryPointContents);
}

function bundleAndSave(path, outFilename) {
  fs.writeFileSync('./'+outFilename+'.appw', bundle(path).map(ins => encodeURIComponent(ins)).join('\n'));
}

function evaluate(instructions) {
  try {
    wlib.evaluate(instructions, wlib.globalStore);
  } catch (e) {
    if (e.message !== 'syntax' && e.message !== 'runtime') {
      throw e;
    }
  }
}

function runBundledCode(path) {
  const instructions = fs.readFileSync(path, 'utf8').split('\n').map(ins => decodeURIComponent(ins));
  evaluate(instructions);
}

function runCode(code) {
  try {  
    const instructions = wlib.compile(code);
    evaluate(instructions);
  } catch (e) {
    if (e.message !== 'syntax') {
      throw e;
    }
  }
}

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
    ` • wildcard watch ${color.fg.green}./path/to/sources${color.reset}          ${color.fg.gray}— start the language server and run the application${color.reset}`,
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

if (process.argv[2] ==='watch') {
  checkArgumentCount('watch', 2, process.argv.length);
  const path = process.argv[3];
  console.log(`Watching the ${path}`);
  const run = () => {
    // try {
      evaluate(bundle(path, false));
    // } catch (e) {}
  }
  run();
  fs.watch(path, function (event, filename) {
    if (filename) {
      console.log('File changed: ' + filename+'\n');
    }
    run();
  });
  return;
}

if (process.argv[2] === 'eval') {
  let expression = process.argv.slice(3).join(' ');
  if (expression.startsWith('"')) {
    expression = expression.slice(1, -1);
  }
  expression = `print(${expression})`;
  runCode(expression);
  return;
}

if (process.argv[2] ==='build') {
  checkArgumentCount('serve', 3, process.argv.length);
  const path = process.argv[4];
  const filename = process.argv[3];
  console.log(`Building ${path}...`);
  try {
    bundleAndSave(path, filename);
    console.log(`Saved to ${filename}.appw`);
  } catch (e) {
    if (e.message !== 'syntax') {
      throw e;
    }
  }
  return;
}

if (process.argv[2] === 'run') {
  const path = process.argv[3];
  runBundledCode(path);
  return;
}

console.log(`${color.fg.red}No such command as ${color.fg.magenta}${process.argv[2]}${color.reset}`);
process.exit(1);
