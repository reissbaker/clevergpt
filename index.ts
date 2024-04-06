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

export function trainingSample() {
  const len = 1 + Math.floor(Math.random() * 20);
  const program: Array<Token> = new Array(len);
  for(let i = 0; i < len; i++) {
    const tokenIdx = Math.floor(Math.random() * tokens.length);
    program[i] = tokens[tokenIdx];
  }

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
