export const registers = {
	rz: 0x0,
	r0: 0x0,
	r1: 0x1,
	r2: 0x2,
	r3: 0x3,
	r4: 0x4,
	r5: 0x5,
	r6: 0x6,
	r7: 0x7,
	r8: 0x8,
	rv: 0x9,
	rsh: 0xA,
	ral: 0xB,
	rah: 0xC,
	rsp: 0xD,
	rbp: 0xE,
	rf: 0xF
};

export const registerList = ["r0", "r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "rv", "rsh", "ral", "rah", "rsp", "rbp", "rf"];

export const instructionsList = [
	"mov", "sta", "lda", "psh", "pop", "jnz", "add", "adc",
	"sub", "sbb", "or", "and", "not"
];

export const instructions = {
	"mov-register-register": {
		encoding: 0x0,
		length: 2
	},
	"mov-register-literal": {
		encoding: 0x1,
		length: 2
	},
	"mov-register": {
		encoding: 0x2,
		length: 1
	},
	"sta-register": {
		encoding: 0x3,
		length: 1
	},
	"lda-literal": {
		encoding: 0x4,
		length: 3
	},
	"psh-register": {
		encoding: 0x5,
		length: 1
	},
	"pop-register": {
		encoding: 0x6,
		length: 1
	},
	"jnz-register": {
		encoding: 0x7,
		length: 1
	},
	"add-register-register": {
		encoding: 0x8,
		length: 2
	},
	"adc-register-register": {
		encoding: 0x9,
		length: 2
	},
	"sub-register-register": {
		encoding: 0xA,
		length: 2
	},
	"sbb-register-register": {
		encoding: 0xB,
		length: 2
	},
	"or-register-register": {
		encoding: 0xC,
		length: 2
	},
	"and-register-register": {
		encoding: 0xD,
		length: 2
	},
	"adc-register": {
		encoding: 0xE,
		length: 1
	},
};

export const Encoding = Object.keys(instructions).reduce((prev, key) => ({ ...prev, [key.toUpperCase().replaceAll("-", "_")]: instructions[key].encoding }), {});