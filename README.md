# Decently Okay Computer

A small emulator for the DOC, a simple computer.

# Architecture

The DOC has access to 64KB of memory (An address consists of 16 bits).

# Registers

 - (0-7) General Purpose Register 1-8
 - (8) Volatile Register (RV)
 - (9) Stack High Byte Register (RSH)
 - (A) Zero Register (RZ)
 - (B) Address Low Byte Register (RAL)
 - (C) Address High Byte Register (RAH)
 - (D) Stack Pointer Register (RSP)
 - (E) Base Pointer Register (RBP)
 - (F) Flags Register (RF)

# Instructions

 - (0) mov (DEST-REG, SOURCE-REG) - Moves a value from SOURCE-REG to DEST-REG
 - (1) mov (REG, INT8) - Moves an intermediate value to REG 
 - (2) mov (REG) - Moves a value from *RA to REG
 - (3) sta (REG) - Moves a value from REG to *RA
 - (4) lda (INT16) - Moves an intermediate value to RA
 - (5) psh (REG) - Pushes a value from REG to the stack
 - (6) pop (REG) - Pops a value from the stack to REG
 - (7) jnz (REG) - REG == 0 ? NOP : RIP = RA
 - (8) add (REGA, REGB) - REGA = REGA + REGB
 - (9) adc (REGA, REGB) - REGA = REGA + REGB + c
 - (A) sub (REGA, REGB) - REGA = REGA - REGB
 - (B) sbb (REGA, REGB) - REGA = REGA - REGB - b
 - (C) or  (REGA, REGB) - REGA = REGA | REGB
 - (D) and (REGA, REGB) - REGA = REGA & REGB
 - (E) not (REG) - REG = ~REG

# Flags

 - (0b00000001) HALT - halts the computer
 - (0b00000010) CARRY - If an 'add' or 'adc' instruction carries from overflow
 - (0b00000100) BORROW - If a 'sub' or 'sbb' instruction borrows from overflow