const DEFAULT_MAX_LENGTH = 21;

// Token types
const tokens = [ 'A', 'B', 'C',  'D' ] as const;
type Token = (typeof tokens)[number];

// Operation types
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

// Compute a step of the program evaluation
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

// Fairly samples programs from the space of all possible programs *up to* a given length i.e. if
// given maxLength of 21, it will generate programs of any token length up to and including 21. All
// valid programs have an equal chance of being sampled
function sampleSpace(maxLength: number) {
  // Consider all possible programs up to maxLength: they're sequences of A, B, C, D tokens. If we
  // treat A as 0, B as 1, etc, this is equivalent to base-4 numbers that are up to maxLength digits
  // long. We can pick an arbitrary number between 0 and (4^maxLength) - 1, convert it to base 4,
  // and use its digits as indices into the tokens array to fairly sample all valid programs that
  // are up to maxLength tokens long.
  const max = Math.pow(4, maxLength) - 1;
  let num = Math.floor(Math.random() * max);
  const digits = num.toString(4);
  const program: Array<Token> = [];
  for(let i = 0; i < digits.length; i++) {
    program.push(tokens[parseInt(digits[i], 10)]);
  }
  return program;
}

// Fairly samples programs of a given length i.e. if given 21, it will generate programs of
// exactly 21 tokens. All valid programs of exactly that size have an equal chance of being sampled
function randomTokensUpTo(length: number) {
  const program: Array<Token> = new Array(length);
  for(let i = 0; i < length; i++) {
    const tokenIdx = Math.floor(Math.random() * tokens.length);
    program[i] = tokens[tokenIdx];
  }
  return program;
}

// Generate a single training sample with a prompt and a correct expected output
export function trainingSample(length?: number) {
  const program = length ? randomTokensUpTo(length) : sampleSpace(DEFAULT_MAX_LENGTH);

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

// Generate a given number of fairly sampled program training data (+ a few extra of special
// long-context ones), and convert them to a format given by the prepareSample callback
export function generate<T>(
  samples: number,
  prepareSample: (sample: { prompt: string, output: string }) => T
): T[] {
  const data: T[] = [];

  for(let i = 0; i < samples; i++) {
    data.push(prepareSample(trainingSample()));
  }

  // Teach it what to do with the degenerate case of single-token programs
  data.push(prepareSample(trainingSample(1)));

  // Give it a few super long context ones
  data.push(prepareSample(trainingSample(100)));
  data.push(prepareSample(trainingSample(75)));
  data.push(prepareSample(trainingSample(50)));

  return data;
}
