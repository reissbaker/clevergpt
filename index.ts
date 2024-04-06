const validationTokens = [ 'A', 'B', 'C',  'D' ] as const;
type ValidationToken = (typeof validationTokens)[number];

const V_DEL = [
  'A B',
  'C D',
];
const V_SWAP = [
  'A D',
  'C B',
];

const V_RULES = [
  ...V_DEL,
  ...V_SWAP,
];

function computeValidationStep(program: string) {
  for(const rule of V_RULES) {
    if(program.match(rule)) {
      if(V_DEL.indexOf(rule) >= 0) {
        return program.replace(rule + ' ', '');
      }
      return program.replace(rule, rule.split(' ').reverse().join(' '));
    }
  }
  return null;
}

export function validationSample() {
  const len = 1 + Math.floor(Math.random() * 10);
  const tokens: Array<ValidationToken> = new Array(len);
  for(let i = 0; i < len; i++) {
    const tokenIdx = Math.floor(Math.random() * validationTokens.length);
    tokens[i] = validationTokens[tokenIdx];
  }

  let program: string | null = tokens.join(' ');
  const prompt = `ABCD is a system with 4 tokens: A, B, C, and D.

An ABCD program is a sequence of tokens. Example:

    C A D B C

To compute a program, we must rewrite neighbor tokens, using the rules:

    A B ... becomes ... nothing
    A D ... becomes ... D A
    C B ... becomes ... B C
    C D ... becomes ... nothing

For example, the program shown here can be computed step-by-step as:

    C A D B C =
    C D A B C =
    A B C =
    C

The steps were:
1. We replaced A D with D A
2. We replaced C D by nothing.
3. We replaced A B by nothing.
The final result was just C.

Now, consider the following program:

${program}

Fully compute it, step by step.`;

  const computation: string[] = [];
  while(program !== null) {
    computation.push(program);
    let next = computeValidationStep(program);
    if(next === program) break;
    program = next;
  }

  return {
    prompt,
    output: computation.join("=\n"),
  };
}


type Program = {
  type: 'terminal',
} | {
  type: 'binding-plus',
  next: Program,
} | {
  type: 'binding-minus',
  next: Program,
} | {
  type: 'lambda',
  body: Program,
};

function genBody(minLength: number, initial: Program) {
  const len = minLength + Math.floor(Math.random() * 3);
  let curr: Program = initial;
  for(let x = 0; x < len; x++) {
    curr = {
      type: Math.random() > 0.5 ? 'binding-plus' : 'binding-minus',
      next: curr,
    };
  }
  return curr;
}

function progToString(prog: Program): string {
  switch(prog.type) {
    case 'terminal': return 'X';
    case 'binding-plus': return `X + ${progToString(prog.next)}`;
    case 'binding-minus': return `X - ${progToString(prog.next)}`;
    case 'lambda': return `Fn X dot ${progToString(prog.body)}`;
  }
};

function computeTrainingStep(prog: Program, data: number) {
  if(prog.type !== 'lambda') throw `wat`;
  const output: string[] = [];
  let curr: Program | null = prog.body;
  while(curr !== null && curr.type !== 'lambda') {
    switch(curr.type) {
      case 'binding-plus':
        output.push(`${data} +`);
        break;
      case 'binding-minus':
        output.push(`${data} -`);
        break;
      case 'terminal':
        output.push(`${data}`);
        break;
    }

    if(curr.type === 'terminal') curr = null;
    else curr = curr.next;
  }

  return {
    output,
    remaining: curr,
  };
}

export function trainingSample() {
  const bindingsLen = Math.floor(Math.random() * 10);
  let program: Program = {
    type: 'lambda',
    body: genBody(0, { type: 'terminal' }),
  };
  for(let i = 0; i < bindingsLen; i++) {
    program = {
      type: 'lambda',
      body: genBody(1, program),
    };
  }

  const appDataLen = 1 + Math.floor(Math.random() * bindingsLen);
  const appData: number[] = [];
  for(let i = 0; i < appDataLen; i++) {
    appData.push(Math.floor(Math.random() * 10));
  }

  const prompt = `REDUCE is a system with five tokens:

1. Fn
2. dot
3. X
4. +
5. -

A program in REDUCE is a series of tokens, plus application data consisting of the digits 0-9; for
example:

Program: Fn X dot X + X + Fn X dot X - Fn X dot X
Application data: 7 8

Fn X dot creates a new variable binding. Moving left to right, any X token can be replaced by the
actual value of the variable, until you hit a new variable binding for X. To compute a program, you
simply iteratively apply the application data as variable bindings. For a step-by-step example:

Fn X dot X + X + Fn X dot X - Fn X dot X =
7 + 7 + Fn X dot X - Fn X dot X =
7 + 7 + 8 - Fn X dot X

Now, consider the following program:

${progToString(program)}

Given the application data:

${appData.map(num => num.toString()).join(' ')}

Fully compute it, step by step.
`;

  let output: string[] = [];
  let last = '';
  let curr: Program | null = program;
  for(const data of appData) {
    if(curr === null) throw `null program u fucked up`;
    const computation = computeTrainingStep(curr, data);
    last = last + (last === '' ? '' : ' ') + computation.output.join(' ');
    curr = computation.remaining;
    output.push(last + (curr === null ? '' : ' ' + progToString(curr)));
  }

  return {
    prompt,
    output: output.join('=\n'),
  };
}
