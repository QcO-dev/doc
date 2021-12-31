import { registers } from "./encoding";

export const languageDef = {
	defaultToken: "",
	registers: Object.keys(registers),
	tokenizer: {
		root: [
			{ include: '@whitespace' },
			[/[a-zA-Z][a-zA-Z0-9]*/, {
				cases: {
					"@registers": "keyword",
					"@default": ""
				}
			}],
			[/\$[a-zA-Z_][a-zA-Z0-9_]*/, "label"],
			[/(#(([0-1]+b)|([0-9a-fA-F]+h)|([0-9]+)))/, 'number'],
			[/(%r[0-9]+)|(%l[0-9]+)/, "parameter"],
			[/@[a-zA-Z_][a-zA-Z0-9_]*/, "type"],
		],
		whitespace: [
			[/[ \t\r\n]+/, 'white'],
			[/;.*$/, 'comment'],
		],
	}
};

export const configuration = {
	comments: {
		lineComment: ";",
	},
};

export const theme = {
	base: 'vs-dark',
	inherit: true,
	rules: [
		{ token: 'label', foreground: 'c9853d' },
		{ token: 'parameter', foreground: '62c458' },
	]
};