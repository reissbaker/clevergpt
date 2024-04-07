const tokens = [ 'A', 'B', 'C',  'D' ] as const;
type Token = (typeof tokens)[number];

const DEL = [
  'A B',
  'C D',
];
const SWAP = [
  'A D',
  'C B',
];

const RULES = [
  ...DEL,
  ...SWAP,
];

function computeStep(program: string) {
  for(const rule of RULES) {
    if(program.match(rule)) {
      if(DEL.indexOf(rule) >= 0) {
        return program.replace(rule + ' ', '');
      }
      return program.replace(rule, rule.split(' ').reverse().join(' '));
    }
  }
  return null;
}

// Fairly samples programs from the space of all possible programs *up to* a given length
// i.e. if given maxLength of 21, it will generate programs of any token length up to 21
function sampleSpace(maxLength: number) {
  const max = Math.pow(4, maxLength) - 1;
  let num = Math.floor(Math.random() * max);
  const digits = num.toString(4);
  const program: Array<Token> = [];
  for(let i = 0; i < digits.length; i++) {
    program.push(tokens[parseInt(digits[i], 10)]);
  }
  return program;
}

// Fairly samples programs of a specific length
// i.e. if given 21, it will generate programs of exactly 21 tokens
function randomTokensUpTo(length: number) {
  const program: Array<Token> = new Array(length);
  for(let i = 0; i < length; i++) {
    const tokenIdx = Math.floor(Math.random() * tokens.length);
    program[i] = tokens[tokenIdx];
  }
  return program;
}

export function trainingSample(length?: number) {
  const program = length ? randomTokensUpTo(length) : sampleSpace(21);

  let programString: string | null = program.join(' ');
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

${programString}

Fully compute it, step by step.`;

  const computation: string[] = [];
  while(programString !== null) {
    computation.push(programString);
    let next = computeStep(programString);
    if(next === programString) break;
    programString = next;
  }

  return {
    prompt,
    output: computation.join(" =\n"),
  };
}
