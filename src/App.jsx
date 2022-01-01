import Editor from "@monaco-editor/react";
import { useRef, useState } from "react";
import "./App.css";
import { assemble } from "./assembler";
import { Emulator } from "./emulator";
import { registerList } from "./encoding";
import { languageDef, configuration, theme } from "./language-def";

const defaultText =`; macro definitions
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

; initialise registers (5, 10, 0, 1)
    mov r1, #5
    mov r2, #10
    mov r3, r0

; multiplication loop top
$top:
    add r3, r1

    ; decrement second number and loop if not zero
    dec r2

    jnz r2, $top

    ; halt the program
    hlt`;

const editorOptions = {
	fontFamily: "JetBrains Mono",
	glyphMargin: true
};

function App() {

	const editorRef = useRef(null);
	const monacoRef = useRef(null);
	const emulatorRef = useRef(new Emulator());
	const decorationsRef = useRef([]);
	const [assembledMemory, setAssembledMemory] = useState([]);
	const [registers, setRegisters] = useState(new Uint8Array(16));
	const [error, setError] = useState(null);

	const editorWillMount = monaco => {
		if (!monaco.languages.getLanguages().some(({ id }) => id === 'doc')) {
			monaco.languages.register({ id: 'doc' });
			monaco.languages.setMonarchTokensProvider('doc', languageDef);
			monaco.languages.setLanguageConfiguration('doc', configuration);
		}

		monaco.editor.defineTheme('docTheme', theme);
	};

	const handleEditorDidMount = (editor, monaco) => {
		editorRef.current = editor;
		monacoRef.current = monaco;
	};

	const handleAssemble = () => {
		const source = editorRef.current.getValue();
		try {
			setAssembledMemory(assemble(source));

			setError(null);

			if(decorationsRef.current.length !== 0) {
				decorationsRef.current = editorRef.current.deltaDecorations(
					decorationsRef.current,
					[]
				);
			}
		} catch(e) {
			const line = e.getLine(source);
			setError(`[${line}] ${e.message}`);

			decorationsRef.current = editorRef.current.deltaDecorations(
				decorationsRef.current,
				[
					{
						range: new monacoRef.current.Range(line, 1, line, 1),
						options: {
							isWholeLine: true,
							className: 'errorLine',
							glyphMarginClassName: 'errorGlyph'
						}
					}
				]
			);
		}
	};

	const handleRun = () => {
		const emulator = emulatorRef.current;
		emulator.emulate(assembledMemory);
		setRegisters(emulator.registers);
	};

	return (
		<div className="App">
			<Editor height="100vh" width="50vw" theme="docTheme" onMount={handleEditorDidMount} 
				language="doc" beforeMount={editorWillMount} options={editorOptions} defaultValue={defaultText} />
			<main>
				<header>
					<p className="title">Decently Okay Computer</p>
					<button onClick={handleAssemble}>Assemble</button>
					<button onClick={handleRun}>Run</button>
				</header>
				<div style={{ display: "flex", gap: "0.5em" }}>
					{error ? <p className="error">{error}</p> :
					assembledMemory.map((b, i) => <p key={i}>{b}</p>)}
				</div>
				<table>
					<thead>
						<tr>
							<th>Register</th>
							<th>Value</th>
						</tr>
					</thead>
					<tbody>
						{
							Array.from(registers).map((v, i) => {
								return (<tr key={i}>
									<td>{registerList[i]}</td>
									<td>{v}</td>
								</tr>);
							})
						}
					</tbody>
				</table>
			</main>
		</div>
	);
}

export default App;
