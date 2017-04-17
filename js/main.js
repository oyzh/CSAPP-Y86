var assembler = new Assembler(); 
var code_text = exampleAssemCode; // the assemble code
var machine = new Y86(); 
assembler.loadAssem(code_text);
var bin_code = assembler.runAssem(); // generate binary code
machine.loadBinCode(bin_code); // load the binary code

var app1 = new Vue({
	el: '#step-run',
	data:{
		todos:[
			{ text:'eax: '+machine.REGISTER[0]},
			{ text:'ecx: '+machine.REGISTER[1]},
			{ text:'edx: '+machine.REGISTER[2]},
			{ text:'ebx: '+machine.REGISTER[3]},
			{ text:'esp: '+machine.REGISTER[4]},
			{ text:'ebp: '+machine.REGISTER[5]},
			{ text:'esi: '+machine.REGISTER[6]},
			{ text:'edi: '+machine.REGISTER[7]},
			{ text:'PC:'+machine.PC},
			{ text:'CC-ZF:'+machine.CC['ZF']},
			{ text:'CC-SF:'+machine.CC['SF']},
			{ text:'CC-OF:'+machine.CC['OF']},
			{ text:'STAT:'+machine.STAT},
			{ text:'Code:\n'+code_text}
			]
	},
	methods:{
		stepRun: function(){
			machine.stepRun();
			this.todos = [
			{ text:'eax: '+machine.REGISTER[0]},
			{ text:'ecx: '+machine.REGISTER[1]},
			{ text:'edx: '+machine.REGISTER[2]},
			{ text:'ebx: '+machine.REGISTER[3]},
			{ text:'esp: '+machine.REGISTER[4]},
			{ text:'ebp: '+machine.REGISTER[5]},
			{ text:'esi: '+machine.REGISTER[6]},
			{ text:'edi: '+machine.REGISTER[7]},
			{ text:'PC:'+machine.PC},
			{ text:'CC-ZF:'+machine.CC['ZF']},
			{ text:'CC-SF:'+machine.CC['SF']},
			{ text:'CC-OF:'+machine.CC['OF']},
			{ text:'STAT:'+machine.STAT},
			{ text:'Code:\n'+code_text}
			];
		}
	}
})
