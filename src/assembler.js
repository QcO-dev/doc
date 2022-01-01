import { instructions, instructionsList, registers } from "./encoding";

export class LexerError extends Error {
	constructor(message, index) {
		super(message);
		this.index = index;
	}

	getLine(source) {
		return source.substring(0, this.index).split("\n").length;
	}
}

export class ParserError extends Error {
	constructor(message, token) {
		super(message);
		this.token = token;
	}

	getLine(source) {
		return source.substring(0, this.token.index).split("\n").length;
	}
}

const matcher = (regex, type) => (input, index) => {
	const match = input.substring(index).match(regex);
	return match && {
		type,
		value: match[0],
		index
	};
};

const tokenMatchers = [
	matcher(`^(${Object.keys(registers).join("|")})`, "register"),
	matcher(`^(${instructionsList.join("|")})[^a-zA-Z_]`, "instruction"),
	matcher(/^[a-zA-Z_][a-zA-Z0-9_]*/, "word"),
	matcher(/^@[a-zA-Z_][a-zA-Z0-9_]*/, "directive"),
	matcher(/^\$[a-zA-Z_][a-zA-Z0-9_]*/, "label"),
	matcher(/^%r[0-9]+/, "register-variable"),
	matcher(/^%l[0-9]+/, "literal-variable"),
	matcher(/^".*?"/, "string"),
	matcher(/^,/, "comma"),
	matcher(/^:/, "colon"),
	matcher(/^[\r\n]+/, "newline"),
	matcher(/^(#(([0-1]+b)|([0-9a-fA-F]+h)|([0-9]+)))/, "literal"),
	matcher(/^;.*/, "whitespace"),
	matcher(/^\s+/, "whitespace")
];

const lex = (text) => {
	const tokens = [];

	let index = 0;

	while(index < text.length) {
		const match = tokenMatchers.map(m => m(text, index)).filter(f => f);
		if(match.length > 0) {
			const value = match[0];

			if(value.type === "instruction") value.value = value.value.trim();

			if(value.type !== "whitespace") tokens.push(value);

			index += value.value.length;

			if(value.type === "string") value.value = value.value.substring(1, value.value.length - 1);
		}
		else {
			throw new LexerError(`Unexpected character '${text.charAt(index)}'`, index);
		}
	}
	return tokens;
};

const parseInteger = (stringRep) => {
	let base = 10;
	if(stringRep.endsWith("h")) {
		base = 16;
		stringRep = stringRep.substring(0, stringRep.length - 1);
	}
	else if(stringRep.endsWith("b")) {
		base = 2;
		stringRep = stringRep.substring(0, stringRep.length - 1);
	}
	return parseInt(stringRep, base);
};

const parse = (tokens) => {

	let index = 0;

	const take = () => tokens[index++] || { type: "EOF", value: "", index: tokens[tokens.length - 1].index };
	const isAtEnd = () => index >= tokens.length;
	const peek = () => tokens[index] || { type: "EOF", value: "", index: tokens[tokens.length - 1].index };
	
	const consume = (type, message) => {
		if(peek().type !== type) {
			throw new ParserError(message, peek());
		}
		return take();
	};

	const match = (type) => {
		if(peek().type === type) {
			take();
			return true;
		}
		return false;
	};

	let currentMacro = null;

	const parseArgs = () => {
		const args = [];
		if(peek().type !== "newline" && peek().type !== "EOF") {
			do {
				const arg = take();
				if(arg.type === "literal") {
					const value = parseInteger(arg.value.substring(1));
					const literal = {
						type: "literal",
						value,
						token: arg
					};
					args.push(literal);
				}
				else if(arg.type === "label") {
					args.push({
						type: "label",
						value: arg.value,
						token: arg
					});
				}
				else if(arg.type === "register") {
					args.push({
						type: "register",
						value: arg.value,
						token: arg
					});
				}
				else if(arg.type === "register-variable") {
					if(currentMacro === null) {
						throw new ParserError("Cannot use variables outside of a macro", arg);
					}
					const value = parseInteger(arg.value.substring(2));

					if(value >= currentMacro.args.register.length) {
						throw new ParserError(`Macro register variable '${value}' exceeds variable count`, arg);
					}

					args.push({
						type: "register-variable",
						value,
						token: arg
					});
				}
				else if(arg.type === "literal-variable") {
					if(currentMacro === null) {
						throw new ParserError("Cannot use variables outside of a macro", arg);
					}
					const value = parseInteger(arg.value.substring(2));

					if(value >= currentMacro.args.literal.length) {
						throw new ParserError(`Macro literal variable '${value}' exceeds variable count`, arg);
					}

					args.push({
						type: "literal-variable",
						value,
						token: arg
					});
				}
				else {
					throw new ParserError("Expected argument", arg);
				}
			} while(match("comma"));
		}
		return args;
	};

	const parseMacroArgs = () => {
		const args = {
			register: [],
			literal: [],
			all: []
		};
		if(peek().type !== "newline" && peek().type !== "EOF") {
			do {
				const arg = take();
				if(arg.type === "register-variable") {
					const value = parseInteger(arg.value.substring(2));
					const rv = {
						type: "register-variable",
						value
					};
					args.register.push(rv);
					args.all.push(rv);
				}
				else if(arg.type === "literal-variable") {
					const value = parseInteger(arg.value.substring(2));
					const lv = {
						type: "literal-variable",
						value
					};
					args.literal.push(lv);
					args.all.push(lv);
				}
				else {
					throw new ParserError("Expected argument", arg);
				}
			} while(match("comma"));
		}
		return args;
	};

	const root = [];

	const parseToken = (token, root) => {
		if(token.type === "instruction") {
			const instruction = {
				type: "instruction",
				value: token.value,
				args: [],
				token
			};
			instruction.args = parseArgs();
			root.push(instruction);
			return true;
		}
		else if(token.type === "word") {
			const macro = {
				type: "macro",
				name: token.value,
				args: [],
				token
			};

			macro.args = parseArgs();

			root.push(macro);
			return true;
		}

		else if(token.type === "label") {
			consume("colon", "Expected ':' after label");

			root.push({
				type: "label",
				value: token.value,
				token
			});
			return true;
		}
		return false;
	};

	while(!isAtEnd()) {
		const token = take();

		if(token.type === "newline") {
			continue;
		}

		const tokenMade = parseToken(token, root);

		if(token.type === "directive" && token.value === "@macro") {
			let name;
			if(peek().type === "word" || peek().type === "instruction") {
				name = take();
			}
			else {
				throw new ParserError("Expected macro name", peek());
			}

			const args = parseMacroArgs();

			const macroDef = {
				type: "macroDef",
				body: [],
				name: name.value,
				args,
				token: name
			};

			currentMacro = macroDef;
			while(!(peek().type === "directive" && peek().value === "@endmacro")) {
				parseToken(take(), macroDef.body);
			}
			take();
			currentMacro = null;

			root.push(macroDef);
		}
		else if(token.type === "directive" && token.value === "@include") {
			const path = consume("string", "Expected include name");

			root.push({
				type: "include",
				path,
				token
			});
		}
		else if(!tokenMade) {
			throw new ParserError("Expected instruction, label, or macro definition", token);
		}
	}

	return root;
};

const assembleParserResult = (root) => {
	
	let addressPointer = 0;

	const labels = {};

	const macros = {};

	// Resolve macros
	for(let node of root) {
		if(node.type === "macroDef") {
			const macroName = [node.name || node.value, ...node.args.all.map(n => n.type)].join("-");
			macros[macroName] = {
				body: node.body
			};
		}
	}

	const macroExpanded = [];

	const expandMacro = (name, args) => {
		const macroName = [name, ...args
			.map(n => n.type)
			.map(n => n === "label" || n === "literal" ? "literal-variable" : n)
			.map(n => n === "register" ? "register-variable" : n)].join("-");
		const macro = macros[macroName];

		const registers = args.filter(n => n.type === "register");
		const literals = args.filter(n => n.type === "label" || n.type === "literal");
		
		if(macro === undefined) {
			return false;
		}

		for(let macroNode of macro.body) {
			if(macroNode.type === "instruction" || macroNode.type === "macro") {
				for(let i = 0; i < macroNode.args.length; i++) {
					const arg = macroNode.args[i];

					if(arg.type === "register-variable") {
						macroNode.args[i] = registers[arg.value];
					}
					else if(arg.type === "literal-variable") {
						macroNode.args[i] = literals[arg.value];
					}
				}

				if(macroNode.type === "macro") {
					const macroExpanded = expandMacro(macroNode.name, macroNode.args);

					if(!macroExpanded) {
						throw new ParserError(`Unknown macro '${macroNode.name}' with arguments: ${macroNode.args.map(n => n.type).join(", ")}`, macroNode.token);
					}
				}
				else {
					const type = macroNode.value;
					const args = macroNode.args;

					const lookUpName = [type, ...args.map(n => n.type).map(n => n === "label" ? "literal" : n)].join("-");

					const instruction = instructions[lookUpName];

					if(instruction === undefined) {
						const macroExpanded = expandMacro(type, args);

						if(!macroExpanded) {
							throw new ParserError(`Unknown instruction '${type}' with arguments: ${args.map(n => n.type).join(", ")}`, macroNode.token);
						}
					}
					else {
						macroExpanded.push(macroNode);
					}
				}
			}
			else {
				macroExpanded.push(macroNode);
			}
		}
		return true;
	};

	for(let node of root) {
		if(node.type === "macroDef") {
			continue;
		}
		if(node.type === "macro") {

			const macroExpanded = expandMacro(node.name, node.args);

			if(!macroExpanded) {
				throw new ParserError(`Unknown macro '${node.name}' with arguments: ${node.args.map(n => n.type).join(", ")}`, node.token);
			}
		}
		else if(node.type === "instruction") {
			const type = node.value;
			const args = node.args;

			const lookUpName = [type, ...args.map(n => n.type).map(n => n === "label" ? "literal" : n)].join("-");

			const instruction = instructions[lookUpName];

			if(instruction === undefined) {
				const macroExpanded = expandMacro(type, args);

				if(!macroExpanded) {
					throw new ParserError(`Unknown instruction '${type}' with arguments: ${args.map(n => n.type).join(", ")}`, node.token);
				}
			}
			else {
				macroExpanded.push(node);
			}
		}
		else {
			macroExpanded.push(node);
		}
	}

	// Resolve labels
	for(let node of macroExpanded) {
		if(node.type === "instruction") {
			const type = node.value;
			const args = node.args;

			const lookUpName = [type, ...args.map(n => n.type).map(n => n === "label" ? "literal" : n)].join("-");

			const instruction = instructions[lookUpName];

			addressPointer += instruction.length;
		}
		else if(node.type === "label") {
			labels[node.value] = addressPointer;
		}
	}

	const byteData = [];

	for(let node of macroExpanded) {
		if(node.type === "instruction") {
			const type = node.value;
			const args = node.args;

			const lookUpName = [type, ...args.map(n => n.type).map(n => n === "label" ? "literal" : n)].join("-");

			const instruction = instructions[lookUpName];

			const encodingArgs = args.map(n => n.type).map(n => n === "label" ? "literal" : n).join("-");

			let firstByte = (instruction.encoding) << 4;

			switch(encodingArgs) {
				case "register-register": {
					firstByte |= registers[args[0].value];
					byteData.push(firstByte);
					byteData.push(registers[args[1].value] << 4);
					break;
				}
				case "register-literal": {
					firstByte |= registers[args[0].value];
					byteData.push(firstByte);
					
					if(args[1].type === "label") {
						throw new ParserError("Cannot use a label as an 8-bit literal value", args[1].token);
					}
					
					if(args[1].value > 0xff) {
						throw new ParserError(`A literal value of '${args[1].value}' exceeds maximum of 0xff (${0xff})`, args[0].token);
					}

					byteData.push(args[1].value & 0xff);
					break;
				}
				case "register": {
					firstByte |= registers[args[0].value];
					byteData.push(firstByte);
					break;
				}
				case "literal": {
					byteData.push(firstByte);

					const value = args[0].type === "label" ? labels[args[0].value] : args[0].value;

					if(value === undefined) {
						throw new ParserError(`Label '${args[0].value}' cannot be resolved`, args[0].token);
					}

					if(value > 0xffff) {
						throw new ParserError(`A literal value of '${value}' exceeds maximum of 0xffff (${0xffff})`, args[0].token);
					}

					byteData.push((value >> 8) & 0xff);
					byteData.push(value & 0xff);
					break;
				}
			}
		}
	}

	return byteData;

};

const expandIncludes = (root, includeLocator) => {
	const expanded = [];
	for(let node of root) {
		if(node.type === "include") {
			const path = node.path.value;

			const source = includeLocator(path);

			if(source === null) {
				throw new ParserError(`Cannot resolve include '${path}'`, node.token);
			}

			const tokens = lex(source);

			const included = parse(tokens);

			expanded.push(...expandIncludes(included, includeLocator));
		}
		else {
			expanded.push(node);
		}
	}
	return expanded;
};

export const assemble = (source, includeResolver) => {
	const tokens = lex(source);

	const root = parse(tokens);

	const expanded = expandIncludes(root, includeResolver);

	return assembleParserResult(expanded);
};