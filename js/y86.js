// GNU GENERAL PUBLIC LICENSE
// Copyright (c) 2017 Zhenhuan Ouyang
// oyzh@zju.edu.cn


// implement CSAPP's y86 machine
var exampleCode = [
  0x30,0xf4,0x00,0x01,0x00,0x00, // init:   irmovl Stack, %esp # Set up stack pointer
  0x30,0xf5,0x00,0x01,0x00,0x00, //         irmovl Stack, %ebp # Set up base pointer
  0x80,0x24,0x00,0x00,0x00,      //         call Main          # Excute main program
  0x00,                          //         halt               # Terminate program
  0x00,0x00,
                                 //         .align 4
  0x0d,0x00,0x00,0x00,           // array:  .long 0xd
  0xc0,0x00,0x00,0x00,           //         .long 0xc0
  0x00,0x0b,0x00,0x00,           //         .long 0xb00
  0x00,0xa0,0x00,0x00,           //         .long 0xa000

  0xa0,0x5f,                     // Main:   pushl %ebp
  0x20,0x45,                     //         rrmovl %esp,%ebp
  0x30,0xf0,0x04,0x00,0x00,0x00, //         irmovl $4,%eax
  0xa0,0x0f,                     //         pushl %eax        # Push 4
  0x30,0xf2,0x14,0x00,0x00,0x00, //         irmovl array,%edx
  0xa0,0x2f,                     //         pushl %edx        # Push array
  0x80,0x42,0x00,0x00,0x00,      //         call Sum          # Sum(array, 4)
  0x20,0x54,                     //         rrmovl %ebp,%esp
  0xb0,0x5f,                     //         popl %ebp
  0x90,                          //         ret

                                 //         # int Sum(int *Start, int Count)
  0xa0,0x5f,                     // Sum:    pushl %ebp
  0x20,0x45,                     //         rrmovl %esp,%ebp
  0x50,0x15,0x08,0x00,0x00,0x00, //         mrmovl 8(%ebp),%ecx  # ecx = Start
  0x50,0x25,0x0c,0x00,0x00,0x00, //         mrmovl 12(%ebp),%edx # edx = Count
  0x63,0x00,                     //         xorl %eax,%eax       # sum = 0
  0x62,0x22,                     //         andl %edx,%edx       # Set condition codes
  0x73,0x78,0x00,0x00,0x00,      //         je End
  0x50,0x61,0x00,0x00,0x00,0x00, // Loop:   mrmovl (%ecx),%esi   # get *Start
  0x60,0x60,                     //         addl %esi,%eax       # add to sum
  0x30,0xf3,0x04,0x00,0x00,0x00, //         irmovl $4,%ebx
  0x60,0x31,                     //         addl %ebx,%ecx       # Start++
  0x30,0xf3,0xff,0xff,0xff,0xff, //         irmovl $-1,%ebx
  0x60,0x32,                     //         addl %ebx,%edx       # Count--
  0x74,0x5b,0x00,0x00,0x00,      //         jne Loop             # Stop when 0
  0x20,0x54,                     // End:    rrmovl %ebp,%esp
  0xb0,0x5f,                     //         popl %ebp
  0x90,0x00,0x00,0x00,0x00,0x00  //         ret
                                 //         .pos 0x100
                                 // Stack:
];


var Y86 = function(){
  // all registers are 4 bytes, save in javascript just a number
  // some util process it to 4
  this.REGISTER = [
    0x00000000, // 0 %eax
    0x00000000, // 1 %ecx
    0x00000000, // 2 %edx
    0x00000000, // 3 %ebx
    0x00000000, // 4 %esp
    0x00000000, // 5 %ebp
    0x00000000, // 6 %esi
    0x00000000  // 7 %edi
  ];
  // condition
  this.CC = {ZF:false, SF:false, OF:false};

  // PC
  this.PC = 0xffffffff;

  // stat
  // 1 -> AOK
  // 2 -> HLT
  // 3 -> ADR
  // 4 -> INS
  this.STAT = 1;

  // memory, each element is a byte(0x0 - 0xff)
  this.DMEM = new Array(0x1000);

  // for code, some constants
  this.INOP    = 0x0; // nop
  this.IHALT   = 0x1; // halt
  this.IRRMOVL = 0x2; // rrmovl
  this.IIRMOVL = 0x3; // irmovl
  this.IRMMOVL = 0x4; // rmmovl
  this.IMRMOVL = 0x5; // mrmovl
  this.IOPL    = 0x6; // integer operation(add,sub...)
  this.IJXX    = 0x7; // jump code
  this.ICALL   = 0x8; // call
  this.IRET    = 0x9; // ret
  this.IPUSHL  = 0xa; // pushl
  this.IPOPL   = 0xb; // popl

  this.FNONE   = 0x0; // default function code

  this.RESP    = 0x4; // %esp id
  this.RNONE   = 0xF; // no registers

  this.ALUADD  = 0x0; // the function of the addl

  this.SAOK    = 0x1; // valid op
  this.SADR    = 0x2; // address error
  this.SINS    = 0x3; // instruction error
  this.SHLT    = 0x4; // halt
  };

// TODO 1 : excutation file format and loader
// TODO 2 : a assember
// TODO 3 : a compiler from high level language(like C) to assemble language

Y86.prototype = {
  // upload a excutation file,
  // the excutation format should be defined.
  loadProgram: function(file){

  },
  loadBinCode: function(text){
	for(var i = 0;i<text.length;i++){
		this.DMEM[i] = text[i];
    }
	this.PC = 0x000000000;
  },
  exampleProgram: function(){
    for(var i = 0; i < exampleCode.length; i++){
      // init the system
      this.DMEM[i] = exampleCode[i];
    }
    this.PC = 0x00000000;

  },

  /////////////////////////////////
  // TOOLS FUNCTION
  // weather an element in an array
  isMember : function(v, arr){
    for (var i = 0; i<arr.length; i++){
      if (v == arr[i]) return true;
    }
    return false;
  },

  // arr contain 4 bytes, we convert it to a integer use complement encode
  word2Value : function(arr){
    // use the complement encode
    var value = 0;
    var flag = arr[0]>>7;
    if (flag == 0) {
      // positive number
      value = (arr[0]<<24) + (arr[1]<<16) + (arr[2]<<8) + arr[3];
    } else {
      // negtive
      value = -(((0x7f - (arr[0]&0x7f))<<24) + ((0xff - arr[1])<<16) + ((0xff-arr[2])<<8) + (0xff-arr[3]) + 1);
    }
    return value;
  },

  value2Word : function(value){
    // make sure the value is valid 32bit integer
    var arr = [0x00,0x00,0x00,0x00];
    if (value < -0x7fffffff-1 || value > 0x7fffffff){
      overflow = true;
    } else{
      if (value < 0){
        arr[0] = (value >> 24) & 0xff;
        arr[1] = (value >> 16) & 0xff;
        arr[2] = (value >> 8) & 0xff;
        arr[3] = value & 0xff;
      } else { // value > 0
        arr[0] = value >> 24;
        arr[1] = (value >> 16) & 0xff;
        arr[2] = (value >> 8) & 0xff;
        arr[3] = value & 0xff;
      }
    }
    return arr;
  },
     /////////////////////////////////

  // fetch instruction
  fetchInstr : function(){

    this.imem_error = false;
    this.instr_valid = true;

    if (this.PC >= this.DMEM.length - 6) {
      this.imem_error = true; // make sure that the pc address is valid, so a program should add some zeros in the end
      this.icode = 0x0; // just set nop
      this.ifun = 0x0;
      return;
    }
    var instructions = this.DMEM.slice(this.PC, this.PC+6); // read 6 bytes
    this.icode = (instructions[0] & 0xf0) >> 4; // first bytes high 4 bits
    this.ifun  = (instructions[0] & 0x0f); // first bytes low 4 bits

    // judge instruction invalid
    var validinstruction = [this.INOP, this.IHALT, this.IRRMOVL, this.IIRMOVL, this.IRMMOVL, this.IMRMOVL, this.IOPL, this.IJXX, this.ICALL, this.IRET, this.IPUSHL, this.IPOPL];
    if (!this.isMember(this.icode, validinstruction)) {
      this.instr_valid = false;
      this.icode = 0x0; // just set nop
      this.ifun = 0x0;
      return;
    }

    // the code need register
    var need_regids = false;
    var needregister = [this.IRRMOVL, this.IOPL, this.IPUSHL, this.IPOPL, this.IIRMOVL, this.IRMMOVL, this.IMRMOVL];
    if (this.isMember(this.icode, needregister)) {
      need_regids = true;
    }

    // the code need a number
    var need_valC = false;
    var needval = [this.IIRMOVL, this.IRMMOVL, this.IMRMOVL, this.IJXX, this.ICALL];
    if (this.isMember(this.icode, needval)) {
      need_valC = true;
    }

    // set register rA and rB
    if (need_regids) {
      // use the second byte
      this.rA = (instructions[1] & 0xf0) >> 4;
      this.rB = (instructions[1] & 0x0f);
    } else {
      this.rA = this.RNONE;
      this.rB = this.RNONE;
    }

    if (need_valC) {
      if (need_regids) {
        // use [2,3,4,5] bytes, be care for small first
        this.valC = this.word2Value([instructions[5],instructions[4],instructions[3],instructions[2]]);
      }
      else {
        // use [1,2,3,4] bytes
        this.valC = this.word2Value([instructions[4],instructions[3],instructions[2],instructions[1]]);
      } 
    } else {
        // do not need valC
      this.valC = 0x0;
    }

    // caculate valP for update PC
    // this.valP = this.PC + 1 + need_regids + 4 * need_valC;
    this.valP = this.PC + 1;
    if(need_regids) this.valP = this.valP + 1;
    if(need_valC) this.valP = this.valP + 4;
  },

  // decoding and write back use the same block, and decoding generate valA and valB, and write back save valM and valE. the blow is the common process for alternate
  preDecodeAndWrite : function() {

    this.srcA = this.RNONE;
    var sourceA = [this.IRRMOVL, this.IRMMOVL, this.IOPL, this.IPUSHL];
    if (this.isMember(this.icode, sourceA)) {
      this.srcA = this.rA;
    }
    if (this.isMember(this.icode, [this.IPOPL, this.IRET])){
      this.srcA = this.RESP;
    }

    this.srcB = this.RNONE;
    var sourceB = [this.IRMMOVL, this.IMRMOVL, this.IOPL];
    if (this.isMember(this.icode, sourceB)) {
      this.srcB = this.rB;
    } else if (this.isMember(this.icode, [this.IPUSHL, this.IPOPL, this.ICALL, this.IRET])) {
      this.srcB = this.RESP;
    }

    this.dstE = this.RNONE;
    var sourceE = [this.IRRMOVL, this.IIRMOVL, this.IOPL];
    var sourceEESP = [this.IPUSHL, this.IPOPL, this.ICALL, this.IRET];
    if(this.isMember(this.icode, sourceE)){
      this.dstE = this.rB;
    } else if(this.isMember(this.icode, sourceEESP)){
      this.dstE = this.RESP;
    }

    this.dstM = this.RNONE;
    var sourceM = [this.IMRMOVL, this.IPOPL];
    if(this.isMember(this.icode, sourceM)){
      this.dstM = this.rA;
    }
  },

  deCode : function(){
    if (this.srcA != this.RNONE) {
      this.valA = this.REGISTER[this.srcA];
    }
    if (this.srcB != this.RNONE) {
      this.valB = this.REGISTER[this.srcB];
    }
  },

  writeBack: function() {
    if (this.dstE != this.RNONE && this.icode!=this.IRRMOVL) {
      this.REGISTER[this.dstE] = this.valE;
    }
    if (this.icode == this.IRRMOVL && this.Cnd == true) { // the book not implement this.
      this.REGISTER[this.dstE] = this.valE;
    } 
    if (this.dstM != this.RNONE) {
      this.REGISTER[this.dstM] = this.valM;
    }
  },

  // ALU
  aluRun : function(){
    // get aluA and aluB
    var aluA = 0;
    if(this.isMember(this.icode, [this.IRRMOVL,this.IOPL])){
      aluA = this.valA;
    } else if(this.isMember(this.icode, [this.IIRMOVL,this.IRMMOVL, this.IMRMOVL])) {
      aluA = this.valC;
    } else if(this.isMember(this.icode, [this.ICALL, this.IPUSHL])) {
      aluA = -4;
    } else if(this.isMember(this.icode, [this.IRET, this.IPOPL])) {
      aluA = 4;
    } else { //Other instructions don't need ALUa
      aluA = 0;
    }

    var aluB = 0;
    if(this.isMember(this.icode, [this.IRRMOVL, this.IIRMOVL])){
      aluB = 0;
    } else { //this.IOPL, this.IMRMOVL, this.ICALL, this.IPUSHL, this.IRET, this.IPOPL,IRMMOVL
      aluB = this.valB;
    }

    // run alu and set Cnd
    var alufun = this.ALUADD;
    if (this.icode == this.IOPL) alufun = this.ifun;

    if (alufun == 0) {// addl
      this.valE = aluB + aluA;
    } else if (alufun == 1){ // subl
      this.valE = aluB - aluA;
    } else if (alufun == 2){ // andl
      this.valE = aluB & aluA;
    } else {
      this.valE = ((~aluB)&aluA) | (aluB&(~aluA));
    }

    var set_cc = false; // weather set CC , only OP
    if(this.icode == this.IOPL) set_cc = true;
    var nvalE = this.valE & 0xffffffff; // overflow
    if(set_cc){
      if( nvalE == 0 ) {
        this.CC.ZF = true;
      } else {
        this.CC.ZF = false;
      }
      if (nvalE < 0){
        this.CC.SF = true;
      } else {
        this.CC.SF = false;
      }
      if (nvalE != this.valE){
        this.CC.OF = true;
      } else {
        this.CC.OF = false;
      }
    }

    this.Cnd = false;
    if(this.icode == this.IJXX || this.icode == this.IRRMOVL) {
      if (this.ifun == 0) this.Cnd = true; // directly jmp or mov
      if (this.ifun == 1 && (this.CC.ZF == true || this.CC.SF == true)) this.Cnd =true; // le
      if (this.ifun == 2 && this.CC.SF == true) this.Cnd = true; // l
      if (this.ifun == 3 && this.CC.ZF == true) this.Cnd = true; // e
      if (this.ifun == 4 && this.CC.ZF == false) this.Cnd = true; // ne
      if (this.ifun == 5 && (this.CC.ZF == true || this.CC.SF == false)) this.Cnd = true; // ge
      if (this.ifun == 6 && this.CC.SF == false) this.Cnd = true; // g
    }
  },

  setStat : function(){
    this.STAT = this.SAOK;
    if (this.icode == this.IHALT){
      this.STAT = this.SHLT;
    } else if (this.imem_error || this.dmem_error) {
      this.STAT = this.SADR;
    } else if (!this.instr_valid) {
      this.STAT= this.SADR;
    }
  },
  // acess memory
  accessMemory : function(){
    var mem_addr = 0;
    this.dmem_error = false;
    if (this.isMember(this.icode, [this.IRMMOVL, this.IPUSHL, this.ICALL, this.IMRMOVL])) {
      mem_addr = this.valE;
    } else if(this.isMember(this.icode, [this.IPOPL, this. IRET])) {
      mem_addr = this.valA;
    } else { // Other instructions don't need address
      return ;
    }

    var mem_data = 0;
    if (this.isMember(this.icode, [this.IRMMOVL,this.IPUSHL])){
      mem_data = this.valA;
    } else if(this.icode == this.ICALL){ // this.ICALL
      mem_data = this.valP;
    }
    // read or write
    var mem_read = false;
    if (this.isMember(this.icode, [this.IMRMOVL, this.IPOPL, this.IRET])){
      mem_read = true;
    }

    var mem_write = false;
    if (this.isMember(this.icode, [this.IRMMOVL,this.ICALL,this.IPUSHL])){
      mem_write = true;
    }

    if (mem_read) {
      if(mem_addr >= this.DMEM.length) {
        this.dmem_error = true;
        this.setStat();
        return;
      }
      var rword = [this.DMEM[mem_addr+3],this.DMEM[mem_addr+2], this.DMEM[mem_addr+1], this.DMEM[mem_addr]];
      this.valM = this.word2Value(rword);
    }
    
    if(mem_write){
      if(mem_addr >= this.DMEM.length) {
        this.dmem_error = true;
        this.setStat();
        return;
      }
      var wword  = this.value2Word(mem_data);
      this.DMEM[mem_addr] = wword[3];
      this.DMEM[mem_addr+1] = wword[2];
      this.DMEM[mem_addr+2] = wword[1];
      this.DMEM[mem_addr+3] = wword[0];
    }
    this.setStat();
  },

  // update PC
  updatePC : function(){
    var new_pc = this.valP;
    if(this.icode == this.ICALL) {
      new_pc = this.valC;
    } else if(this.icode == this.IRET) {
      new_pc = this.valM;
    } else if(this.icode == this.IJXX && this.Cnd){
      new_pc = this.valC;
    }
    this.PC = new_pc;
  },
  // run one step, the address is PC
  stepRun : function(){
    this.fetchInstr();
    this.preDecodeAndWrite();
    this.deCode();
    this.aluRun();
    this.accessMemory();
    this.writeBack();
    this.updatePC();
  },

  // save machine
  toJson : function(){
    var json = {};
  },

  // load machine
  fromJson : function(json){
  }
};
