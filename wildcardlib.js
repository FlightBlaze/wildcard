function infixToPostfix(infixExpression) {
  const operators = {
    '.': 4,
    '+': 2,
    '-': 2,
    '%': 3,
    '*': 3,
    '/': 3,
    '==': 4.5,
    '&': 4.3,
    '|': 4.4,
    '=': 7,
    ' ': 1,
    '\n': 1.5,
    '?': 6,
    ':': 6,
    '__minus': 2
  };

  const stack = [];
  const output = [];
  let operatorBefore = true;
  let parenthesisBefore = false;
  let operatorDeclaredBefore = false;
  let callsBefore = 0;
  let lineNumber = 1;
  let filename = '';

  const error = (message) => {
    console.error('Syntax Error: '+message+' at line '+lineNumber+' in file '+filename+'.w');
    throw new Error('syntax');
  }

  let operatorChars = [];

  const addOperator = () => {
    const operator = operatorChars.join('');

    if (operator === '"') {
      error('Only single quoted strings are allowed');
    }

    if (operators[operator]) {
      if ((operatorDeclaredBefore !== operatorBefore) && operatorBefore && !parenthesisBefore && operator !== '-') {
        error('Doubled operator');
      }

      while (stack.length && operators[stack[stack.length - 1]] > operators[operator]) {
        output.push(stack.pop() + ' ');
      }
      if ((operatorDeclaredBefore === operatorBefore) && operator === '-') {
        stack.push('__minus');
      } else {
        stack.push(operator);
      }
      operatorBefore = true;
    } else if (operatorChars.length) {
      error('Invalid operator');
    }
    operatorChars = [];
  }

  for (let i = 0; i < infixExpression.length; i++) {
    const char = infixExpression[i];

    if (char === '_' && infixExpression[i+1] === '_') {
      let magicOpChars = [];
      let j = i;
      for (; j < infixExpression.length; j++) {
        if (infixExpression[j] === '\n' || infixExpression[j] === ' ') {
          break;
        }
        magicOpChars.push(infixExpression[j]);
      }
      const magicOp = magicOpChars.join('');
      if (magicOp.startsWith('__filename_')) {
        filename = magicOp.slice('__filename_'.length);
        lineNumber = 0;
        output.push(magicOp+' ');
        i = j;
        continue;
      }
    }

    if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
      output.push(' ');
      if (char === '\n') {
        stack.push('\n');
        lineNumber++;
      }
      if (!operatorBefore) {
        while (stack.length && operators[stack[stack.length - 1]] > operators[' ']) {
          output.push(stack.pop() + ' ');
        }
        stack.push(' ');
      }
      continue;
    }

    if (!isNaN(char) || char.toLowerCase() != char.toUpperCase() || char === '_') {
      addOperator();
      output.push(char);
      operatorBefore = false;
      operatorDeclaredBefore = false;
    } else if (char === '(') {
      if(!operatorBefore && i !== 0) {
        output.push(' __pushfunc ');
        callsBefore++;
      }
      stack.push(char);
      operatorBefore = true;
      parenthesisBefore = true;
    } else if (char === ')') {
      if (stack.length === 0) {
        error('Unmatched parenthesis');
      }
      while (stack.length && stack[stack.length - 1] !== '(') {
        output.push(' ' + stack.pop() + ' ');
      }
      stack.pop();
      stack.push(' ');
      if(callsBefore !== 0) {
        output.push(' __callfunc ');
        if (stack.length) {
          const stackChar = stack.pop();
          if (stackChar !== '(') {
            output.push(' ' + stackChar + ' ');
          }
        }
        callsBefore--;
      }
    } else {
      operatorChars.push(char);
      output.push(' ');
      operatorDeclaredBefore = true;
    }
    if (char !== '(') {
      parenthesisBefore = false;
    }
  }
  while (stack.length !== 0) {
    const stackChar = stack.pop();
    if (stackChar === '(') {
      error('Unclosed parenthesis');
    }
    output.push(' ' + stackChar + ' ');
  }
  return output.join('').replaceAll('\n', '__newline');
}

function extractData(expression) {
  const output = [];
  const data = [];
  let insideString = false;
  let insideFunction = false;
  let insideComment = false;
  let scanningNumber = false;
  let parenthesisWasBefore = false;
  let filename = '';
  let functionNestingLevel = 0;

  const error = (message) => {
    console.error('Syntax Error: '+message+' in file '+filename+'.w');
    throw new Error('syntax');
  }

  const afterScanningNumber = () => {
    if (scanningNumber) {
      data[data.length - 1] = data[data.length - 1].join('');
      output.push(' __data_' + (data.length - 1) + ' ');
      scanningNumber = false;
    }
  }

  const isCharDefinitelyNotAboutNumber = (char) =>
      isNaN(char) && char !== ' ' && char !== '\n' && char !== '\t' && char !== '\r' && char !== '.'

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    const nextChar = expression[i + 1];

    if (char === '/' && nextChar === '?') {
      insideComment = true;
      continue;
    }
    if (char === '?' && nextChar === '/') {
      insideComment = false;
      continue;
    }
    if (char === '_' && nextChar === '_' && !insideString) {
      let magicOpChars = [];
      let j = i;
      for (; j < expression.length; j++) {
        if (expression[j] === '\n' || expression[j] === ' ') {
          break;
        }
        magicOpChars.push(expression[j]);
      }
      const magicOp = magicOpChars.join('');
      if (magicOp.startsWith('__filename_')) {
        filename = magicOp.slice('__filename_'.length);
        lineNumber = 0;
        output.push(magicOp+' ');
        i = j;
        continue;
      }
    }
    if (insideComment) {
      if (char === '\n') {
        output.push(char);
      }
      continue;
    }
    if (char === ')') {
      parenthesisWasBefore = true;
    } else if (isCharDefinitelyNotAboutNumber(char)) {
      parenthesisWasBefore = false;
    }
    if (char === "'" || char === '[' || char === ']') {
      const wasInsideFunction = insideFunction;
      if (!insideFunction || char !== "'") {
        insideString = !insideString;
      }
      if (char === '[') {
        functionNestingLevel++;
        insideFunction = true;
        insideString = true;
      } else if (char === ']') {
        functionNestingLevel--;
        if (functionNestingLevel === 0) {
          insideFunction = false;
          insideString = false;
        } else {
          insideFunction = true;
          insideString = true;
        }
      }
      if (insideString && !wasInsideFunction && char === '[') {
        data.push([char]);
      } else if (insideFunction && char === "'") {
        data[data.length - 1].push(char);
      } else if ((wasInsideFunction || (!insideString && char === "'")) && functionNestingLevel === 0) {
        data[data.length - 1] = data[data.length - 1].concat([char]).join('');
        output.push('__data_' + (data.length - 1));
      } else if (insideString && char === "'") {
        data.push([char]);
      } else {
        data[data.length - 1].push(char);
      }
    } else {
      if (insideString) {
        data[data.length - 1].push(char);
      }
      else {
        if (!isNaN(char) && char !== ' ' && char !== '\n') {
          if (!scanningNumber) {
            scanningNumber = true;
            data.push([]);
          }
          data[data.length - 1].push(char);
        }
        else if (char === '.') {
          if (scanningNumber && !parenthesisWasBefore) {
            data[data.length - 1].push(char);
          } else {
            afterScanningNumber();
            output.push(char);
          }
        }
        else if (char.toLowerCase() === char.toUpperCase()) {
          afterScanningNumber();
          output.push(char);
        }
        else {
          output.push(char);
        }
      }
    }
  }
  afterScanningNumber();
  if (insideString) {
    if (insideFunction) {
      error('Unclosed bracket');
    } else {
      error('Unclosed string');
    }
  }
  return [output.join(''), data];
}

const unescapeUnicode = (str) => decodeURIComponent(JSON.parse(`"${str}"`))

function substitudeData(postfixExpression, data) {
  const cmds = postfixExpression.split(' ');
  const output = [];
  for (let i = 0; i < cmds.length; i++) {
    if (cmds[i].startsWith('__data_')) {
      const item = data[parseInt(cmds[i].replace('__data_', ''))];
      output.push(item.startsWith("'") ? unescapeUnicode(item) : item);
    }
    else if(cmds[i] !== '') {
      output.push(cmds[i]);
    }
  }
  return output;
}

function compile(expression) {
  const [expr, data] = extractData(expression);
  // console.log(substitudeData(infixToPostfix(expr), data));
  return substitudeData(infixToPostfix(expr), data);
}

function evaluate(instructions, globalStore, _startLevel = 0, initialOperands = []) {
  let operandStack = [...initialOperands];
  let functionStack = [];
  let variableStack = [[]];
  let operandPopCountStack = [0];
  let lineNumber = 1;
  let filename = '';

  const popAllOperandsInCurrentScope = () => {
    const count = operandPopCountStack.pop();
    for (let i = 0; i < count; i++) {
      operandStack.pop();
    }
  }

  const incrementOperandPopCount = () => {
    operandPopCountStack[operandPopCountStack.length - 1]++;
  }

  const decrementOperandPopCount = () => {
    operandPopCountStack[operandPopCountStack.length - 1]--;
  }

  const getVariable = (name) => globalStore.hasOwnProperty(name) ? globalStore[name].value : undefined

  const readOperand = (operand) => {
    if (typeof operand === 'string' && operand.startsWith("'")) {
      return operand.slice(1, operand.length - 1);
    } if (typeof operand === 'string' && operand.startsWith("[")) {
      return operand;
    } else if (typeof operand === 'number' || typeof operand === 'boolean') {
      return operand;
    } else if (!isNaN(operand)) {
      return parseFloat(operand);
    } else if (operand === undefined) {
      return undefined;
    } else if (operand === 'yes') {
      return true;
    } else if (operand === 'no') {
      return false;
    } else if (operand === 'unset') {
      return undefined;
    } else if (operand === 'nil') {
      return null;
    } else if (typeof operand === 'object') {
      return operand;
    }
    return getVariable(operand);
  }

  const unquoteString = (operand) => {
    if (typeof operand === 'string' && operand.startsWith("'")) {
      return operand.slice(1, operand.length - 1);
    }
    return operand;
  }

  const popOperandAndRead = () => {
    decrementOperandPopCount();
    return readOperand(operandStack.pop());
  }

  const packOperand = (operand) => {
    if (typeof operand === 'string' && !operand.startsWith("'") && !operand.startsWith("[")) {
      return "'"+operand+"'";
    } else {
      return operand;
    }
  }

  const pushOperand = (operand) => {
    operandStack.push(packOperand(operand));
    incrementOperandPopCount();
  }

  const error = (message, info = '') => {
    console.error('Runtime Error: '+message+' at line '+lineNumber+' in file '+ filename+'.w' + (info.length ? ' ' + info : ''));
    throw new Error('runtime');
  }

  const pushFunction = () => {
    functionStack.push(operandStack.pop());
    variableStack.push([]);
    decrementOperandPopCount();
    operandPopCountStack.push(0);
  }
  
  const callFunction = () => {
    const func = functionStack.pop();
    let funcBody = func;
    const currentNestingLevel = functionStack.length + 1;
    if (!func.startsWith('[')) {
      funcBody = globalStore[func].value;
    }
    const operands = [];
    for (let i = 0; i < operandPopCountStack[operandPopCountStack.length - 1]; i++) {
      operands.push(operandStack[operandStack.length - 1 - i]);
    }
    if (typeof funcBody === 'string' && funcBody.startsWith('[')) {
      popAllOperandsInCurrentScope();
      pushOperand(evaluate(compile(funcBody.slice(1, funcBody.length - 1)), globalStore, currentNestingLevel, operands.map((op) => packOperand(readOperand(op)))));
    } else if (typeof funcBody === 'function') {
      popAllOperandsInCurrentScope();
      funcBody({
        operandStack, functionStack, variableStack, pushOperand, popOperandAndRead, readOperand, globalStore, operands,
        incrementOperandPopCount, decrementOperandPopCount, lineNumber, getVariable, pushFunction, callFunction, error
      });
    }
    for (const varName of variableStack.pop()) {
      delete globalStore[varName];
    }
  }

  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i];
    if (instruction === '__pushfunc') {
      pushFunction();
    }
    else if (instruction === '__callfunc') {
      callFunction();
    }
    else if (instruction === '__newline') {
      lineNumber++;
    }
    else if (instruction.startsWith('__filename')) {
      filename = instruction.replace('__filename', '');
      lineNumber = 0;
    }
    // else if (instruction.startsWith('__data_')) {
    //   stack[stack.length - 1].push(data[parseInt(instruction.replace('__data_', ''))]);
    // }
    else if (instruction === '+' || instruction === '-' || instruction === '*'
      || instruction === '/' || instruction === '==' || instruction === '?' || instruction === ':' ||
      instruction == '&' || instruction === '|') {
      const b = popOperandAndRead();
      const a = popOperandAndRead();
      switch(instruction) {
        case '+':
          pushOperand(a + b);
          break;
        case '-':
          pushOperand(a - b);
          break;
        case '*':
          pushOperand(a * b);
          break;
        case '/':
          pushOperand(a / b);
          break;
        case '==':
          pushOperand(a === b);
          break;
        case '?':
          pushOperand(a? b : a);
          break;
        case ':':
          pushOperand(a? a : b);
          break;
        case '&':
          pushOperand(a && b);
          break;
        case '|':
          pushOperand(a || b);
          break;
        case '%':
          pushOperand(a % b);
          break;
      }
    }
    else if (instruction === '__minus') {
      const a = popOperandAndRead();
      pushOperand(-a);
    }
    else if (instruction === '=') {
      const b = popOperandAndRead();
      const a = unquoteString(operandStack.pop());
      decrementOperandPopCount();
      globalStore[a] = { value: b, level: functionStack.length + 1 };
      variableStack[variableStack.length - 1].push(a);
    }
    else if (instruction === '.') {
      const b = unquoteString(operandStack.pop());
      const a = unquoteString(operandStack.pop());
      decrementOperandPopCount();
      decrementOperandPopCount();
      if (typeof a !== 'object' && !globalStore.hasOwnProperty(a)) {
        error('Cannot read properties of a primitive or unset object');
      }
      const leftOperand = typeof a === 'object' ? a : globalStore[a].value
      if (!isNaN(b) || typeof b === 'number') {
        pushOperand(leftOperand.arr[parseInt(b - 1)]);
      } else {
        pushOperand(leftOperand.kv[b]);
      }
    }
    else {
      operandStack.push(instruction);
      incrementOperandPopCount();
    }
  }
  if (operandStack.length !== 0) {
    return popOperandAndRead();
  }
}

function buildGlobalStore(obj) {
  const store = {};
  for (let key in obj) {
    store[key] = { value: obj[key], level: 0 };
  }
  return store;
}

const globalStore = buildGlobalStore({
  complex: (state) => {
    const args = state.variableStack[state.variableStack.length - 1];
    const complexObj = {kv: {}, arr: [], ind: []}
    complexObj.ind = [...state.operands].reverse().map(op => state.readOperand(op));
    complexObj.arr = [...complexObj.ind];
    for (let i = 0; i < args.length; i++) {
      complexObj.kv[args[i]] = state.globalStore[args[i]].value;
      complexObj.arr.push(state.globalStore[args[i]].value);
    }
    state.operandStack.push(complexObj);
    state.incrementOperandPopCount();
  },
  print: (state) => {
    const preprocess = (value) => {
      if (typeof value === 'object') {
        return '('+value.ind.map(val => preprocess(val)).concat(Object.keys(value.kv).map(k => k + ': ' + value.kv[k])).join(', ')+')';
      } else if (typeof value === 'boolean') {
        return value ? 'yes' : 'no';
      }
      else if (typeof value === 'string') {
        return "'" + value + "'";
      } else if (value === undefined) {
        return 'unset';
      } else if (value === null) {
        return 'nil';
      }
      return value;
    }
    const args = state.variableStack[state.variableStack.length - 1];
    console.log(args.map(arg => arg+': '+preprocess(state.globalStore[arg].value)).concat(state.operands.map(op => preprocess(state.readOperand(op)))).join(', '));
  },
  range: (state) => {
    const args = [...state.operands].reverse();
    const arg1 = args[0] ? state.readOperand(args[0]) : 0;
    const arg2 = args[1] ? state.readOperand(args[1]) : 0;
    const step = args[2] ? state.readOperand(args[2]) : 1;
    const start = args.length === 1 ? 1 : arg1;
    const end = args.length === 1 ? arg1 : arg2;
    const complexObj = {kv: {}, arr: [], ind: []}
    complexObj.ind = [];
    for (let i = start; i <= end; i += step) {
      complexObj.ind.push(i);
      complexObj.arr.push(i);
    }
    state.operandStack.push(complexObj);
    state.incrementOperandPopCount();
  },
  map: (state) => {
    const operands = [...state.operands].reverse();
    if (operands.length > 2 || operands.length === 0) {
      state.error('Map requires 2 arguments');
    }
    const func = operands.length === 1 ? operands[0] : operands[1];
    const complex = operands.length === 1
      ? state.operandStack[state.operandStack.length - 1]
      : operands[0];
    if (operands.length === 1) {
      state.operandStack.pop();
      state.decrementOperandPopCount();
    }
    const newComplexObj = {kv: {}, arr: [], ind: []}
    for (let i = 0; i < complex.arr.length; i++) {
      state.pushOperand(func);
      state.pushFunction();
      state.pushOperand(complex.arr[i]);
      state.globalStore['it'] = { value: complex.arr[i] };
      state.callFunction();
      newComplexObj.ind.push(state.popOperandAndRead());
    }
    newComplexObj.arr = [...newComplexObj.ind];
    state.operandStack.push(newComplexObj);
    state.incrementOperandPopCount();
  },
  reduce: (state) => {
    const operands = [...state.operands].reverse();
    if (operands.length > 2 || operands.length === 0) {
      state.error('Reduce requires 2 arguments');
    }
    const hasInitialDeclared = state.variableStack[state.variableStack.length - 1]
      .filter(varName => varName === 'initial').length !== 0;
    const initial = hasInitialDeclared ? state.getVariable('initial') || 0 : 0;
    const func = operands.length === 1 ? operands[0] : operands[1];
    const complex = operands.length === 1
      ? state.operandStack[state.operandStack.length - 1]
      : operands[0];
    if (operands.length === 1) {
      state.operandStack.pop();
      state.decrementOperandPopCount();
    }
    let newValue = initial;
    for (let i = 0; i < complex.arr.length; i++) {
      state.pushOperand(func);
      state.pushFunction();
      state.globalStore['it'] = { value: complex.arr[i] };
      state.pushOperand(newValue);
      state.callFunction();
      newValue = state.popOperandAndRead();
    }
    state.operandStack.push(newValue);
    state.incrementOperandPopCount();
  },
  join: (state) => {
    const operands = [...state.operands].reverse();
    if (operands.length > 1) {
      state.error('Join requires at least 1 argument');
    }
    const isSeparatorDeclared = state.variableStack[state.variableStack.length - 1]
      .filter(varName => varName === 'sep').length !== 0;
    const separator = isSeparatorDeclared ? state.getVariable('sep') || '' : '';
    const complex = operands.length === 0
      ? state.operandStack[state.operandStack.length - 1]
      : operands[0];
    if (typeof complex !== 'object') {
      state.error('Join only works with a complex', '\nExample usage: join(complex(1 2 3 4 5) sep=\', \')');
    }
    if (operands.length === 0) {
      state.operandStack.pop();
      state.decrementOperandPopCount();
    }
    state.pushOperand(complex.arr.join(separator));
  },
  genId: (state) => {
    state.pushOperand(Math.random().toString(36).substring(2, 15));
  },
  kind: (state) => {
    if (state.operands.length !== 1) {
      state.error('Kind requires exactly 1 argument');
    }
    const operand = state.readOperand(state.operands[0]);
    if (typeof operand === 'object') {
      state.pushOperand('complex');
    } else if (typeof operand === 'boolean') {
      state.pushOperand('boolean');
    } else if (typeof operand === 'number') {
      state.pushOperand('number');
    } else if (typeof operand ==='string') {
      state.pushOperand('string');
    } else if (typeof operand === 'undefined') {
      state.pushOperand('nothing');
    } else if (operand === null) {
      state.pushOperand('nil');
    } else {
      state.pushOperand('unknown');
    }
  },
  len: (state) => {
    if (state.operands.length > 1) {
      state.error('Len requires exactly 1 argument');
    }
    const operand = state.operands.length === 0
      ? state.operandStack[state.operandStack.length - 1]
      : state.readOperand(state.operands[0]);
    if (typeof operand !== 'object') {
      state.error('Len only works with a complex');
    }
    state.pushOperand(operand.arr.length);
  }
}); 

exports.globalStore = globalStore;
exports.buildGlobalStore = buildGlobalStore;
exports.compile = compile;
exports.evaluate = evaluate;
