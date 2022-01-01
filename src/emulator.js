import { registers as registerMap, Encoding } from "./encoding";

//TODO Flags with compare, carry and borrow
export class Emulator {

	assembledMemory = null;
	memory = null;
	registers = null;

	emulate(assembledMemory) {
		this.memory = new Uint8Array(49152);
		this.memory.set(assembledMemory);
	
		this.registers = new Uint8Array(16);
	
		let ip = 0;
	
		const getRA = () => (this.registers[registerMap.rah] << 8) | this.registers[registerMap.ral];
	
		while(!(this.registers[registerMap.rf] & 0x1)) {
			
			switch(this.memory[ip] >> 4) {
	
				case Encoding.MOV_REGISTER_REGISTER: {
					const regA = this.memory[ip++] & 0xf;
					const regB = this.memory[ip++] >> 4;
	
					this.registers[regA] = this.registers[regB];
					
					break;
				}
	
				case Encoding.MOV_REGISTER_LITERAL: {
					const register = this.memory[ip++] & 0xf;
					const literal = this.memory[ip++];
	
					this.registers[register] = literal;
					break;
				}
	
				case Encoding.MOV_REGISTER: {
					const register = this.memory[ip++] & 0xf;
	
					const address = getRA();
	
					this.registers[register] = this.memory[address];
	
					break;
				}
	
				case Encoding.STA_REGISTER: {
					const register = this.memory[ip++] & 0xf;
	
					const address = getRA();
	
					this.memory[address] = this.registers[register];
	
					break;
				}
	
				case Encoding.LDA_LITERAL: {
					ip += 1;
					this.registers[registerMap.rah] = this.memory[ip++];
					this.registers[registerMap.ral] = this.memory[ip++];
	
					break;
				}
	
				case Encoding.PSH_REGISTER: {
					const register = this.memory[ip++] & 0xf;
	
					this.memory[this.registers[registerMap.rsp]--] = this.registers[register];
	
					break;
				}
	
				case Encoding.POP_REGISTER: {
					const register = this.memory[ip++] & 0xf;
	
					this.registers[register] = this.memory[++this.registers[registerMap.rsp]];
	
					break;
				}
	
				case Encoding.JNZ_REGISTER: {
					const register = this.memory[ip++] & 0xf;
	
					if(this.registers[register] !== 0) {
						ip = getRA();
					}
	
					break;
				}
	
				case Encoding.ADD_REGISTER_REGISTER: {
					const regA = this.memory[ip++] & 0xf;
					const regB = this.memory[ip++] >> 4;
	
					if(regA + regB > 0xff) {
						this.registers[registerMap.rf] |= 0x2;
					}
					else {
						this.registers[registerMap.rf] &= 0xff - 0x2;
					}
	
					this.registers[regA] += this.registers[regB];
					this.registers[regA] &= 0xff;
					break;
				}
	
				case Encoding.ADC_REGISTER_REGISTER: {
					const regA = this.memory[ip++] & 0xf;
					const regB = this.memory[ip++] >> 4;
	
					const carry = this.registers[registerMap.rf] & 0x2;
	
					this.registers[regA] += this.registers[regB] + carry;
					this.registers[regA] &= 0xff;
					break;
				}
	
				case Encoding.SUB_REGISTER_REGISTER: {
					const regA = this.memory[ip++] & 0xf;
					const regB = this.memory[ip++] >> 4;
	
					if(regB >= regA) {
						this.registers[registerMap.rf] |= 0x4;
					}
					else {
						this.registers[registerMap.rf] &= 0xff - 0x4;
					}
	
					this.registers[regA] -= this.registers[regB];
					this.registers[regA] &= 0xff;
					break;
				}
	
				case Encoding.SBB_REGISTER_REGISTER: {
					const regA = this.memory[ip++] & 0xf;
					const regB = this.memory[ip++] >> 4;
	
					const borrow = this.registers[registerMap.rf] & 0x4;
	
					if(regB + borrow >= regA) {
						this.registers[registerMap.rf] |= 0x4;
					}
					else {
						this.registers[registerMap.rf] &= 0xff - 0x4;
					}
	
					this.registers[regA] -= this.registers[regB] - borrow;
					this.registers[regA] &= 0xff;
					break;
				}
	
				case Encoding.OR_REGISTER_REGISTER: {
					const regA = this.memory[ip++] & 0xf;
					const regB = this.memory[ip++] >> 4;
	
					this.registers[regA] |= this.registers[regB];
					break;
				}
	
				case Encoding.AND_REGISTER_REGISTER: {
					const regA = this.memory[ip++] & 0xf;
					const regB = this.memory[ip++] >> 4;
	
					this.registers[regA] &= this.registers[regB];
					break;
				}
	
				case Encoding.NOT_REGISTER: {
					const register = this.memory[ip++] & 0xf;
	
					this.registers[register] = (~this.registers[register]) & 0xff;
	
					break;
				}
	
			}
		}
	
	}

}