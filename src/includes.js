const std = `
@macro hlt
			mov rv, #1
			or rf, rv
		@endmacro

		@macro sub %r0, %l0
			mov rv, %l0
			sub %r0, rv
		@endmacro

		@macro dec %r0
			sub %r0, #1
		@endmacro

		@macro jnz %r0, %l0
			lda %l0
			jnz %r0
		@endmacro
`;

const includes = {
	"std.asm": std
};

export const resolveInclude = (path) => includes[path] ?? null;
