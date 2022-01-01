import Editor from "@monaco-editor/react";
import { useRef, useState } from "react";
import "./App.css";
import { assemble } from "./assembler";
import { resolveInclude } from "./includes";
import { Emulator } from "./emulator";
import { registerList } from "./encoding";
import { languageDef, configuration, theme } from "./language-def";

const defaultText =`@include "std.asm"

; initialise registers (5, 10, 0)
    mov r1, #5
    mov r2, #10
    mov r3, r0

; multiplication loop top
$top:
    add r3, r1

    ; decrement second number and loop if not zero
    dec r2

    jnz r2, $top

    ; halt the program - result is in r3
    hlt`;

const editorOptions = {
	fontFamily: "JetBrains Mono",
	glyphMargin: true,
	scrollBeyondLastLine: false
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
			setAssembledMemory(assemble(source, resolveInclude));

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

				{<p className="error">{error ?? ""}</p>}

				<div className="monitors">
					<div style={{ display: "flex", gap: "0.5em" }}>
						{assembledMemory.map((b, i) => <p key={i}>{b}</p>)}
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
				</div>
			</main>
		</div>
	);
}

export default App;
