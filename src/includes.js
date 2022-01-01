const std = `
@macro sta %l0, %r0
	lda %l0
	sta %r0
@endmacro

@macro psh %l0
	mov rv, %l0
	psh rv
@endmacro

@macro jnz %r0, %l0
	lda %l0
	jnz %r0
@endmacro

@macro jnz %l0
	mov rv, %l0
	jnz rv
@endmacro

@macro jnz %l0, %l1
	mov rv, %l0
	lda %l1
	jnz rv
@endmacro

@macro add %r0, %l0
	mov rv, %l0
	add %r0, rv
@endmacro

@macro adc %r0, %l0
	mov rv, %l0
	adc %r0, rv
@endmacro

@macro sub %r0, %l0
	mov rv, %l0
	sub %r0, rv
@endmacro

@macro sbb %r0, %l0
	mov rv, %l0
	sbb %r0, rv
@endmacro

@macro or %r0, %l0
	mov rv, %l0
	or %r0, rv
@endmacro

@macro and %r0, %l0
	mov rv, %l0
	and %r0, rv
@endmacro

@macro dec %r0
	sub %r0, #1
@endmacro

@macro inc %r0
	add %r0, #1
@endmacro

@macro movm %r0, %l0
	lda %l0
	mov %r0
@endmacro

@macro nand %r0, %r1
	and %r0, %r1
	not %r0
@endmacro

@macro nand %r0, %l0
	and %r0, %l0
	not %r0
@endmacro

@macro nor %r0, %r1
	or %r0, %r1
	not %r0
@endmacro

@macro nor %r0, %l0
	or %r0, %l0
	not %r0
@endmacro

@macro xor %r0, %r1
	mov rv, %r1
	or rv, %r0
	nand %r0, %r1
	and %r0, rv
@endmacro

@macro xor %r0, %l0
	mov rv, %l0
	xor %r0, rv
@endmacro

@macro xnor %r0, %r1
	mov rv, %r0
	nor %r0, %r1
	and rv, %r1
	or %r0, rv
@endmacro

@macro xnor %r0, %l0
	mov rv, %l0
	xnor %r0, rv
@endmacro

@macro inb %r0, %l0
	mov rah, #eeh
	mov ral, %l0
	mov %r0
@endmacro

@macro outb %l0, %r0
	mov rah, #eeh
	mov ral, %l0
	sta %r0
@endmacro

@macro hlt
	or rf, #1
@endmacro
`;

const includes = {
	"std.asm": std
};

export const resolveInclude = (path) => includes[path] ?? null;
