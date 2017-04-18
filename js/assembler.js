// GNU GENERAL PUBLIC LICENSE
// Copyright (c) 2017 Zhenhuan Ouyang
// oyzh@zju.edu.cn

// implement CSAPP y86's assembler

var Assembler = function(){
  this.code = []; // save the code, e.g. {index1:[0x10,0xff],index2:[0x23,0xff]}
  this.symbol_table = {}; // save the symbol and address, {start:100,Loop:200}
  this.write_back = {}; // write back the symbol's address {start:[300,400], Loop:[12,32]}
  this.code_pos = 0;

  // instructions
  this.HALT         = 0;  // halt
  this.NOP          = 1;  // nop
  this.RRMOVL       = 2;  // rrmovl
  this.CMOVXX       = 2;  // cmoveXX
  this.IRMOVL       = 3;  // irmovl
  this.RMMOVL       = 4;  // rmmovl
  this.MRMOVL       = 5;  // mrmovl
  this.OPL          = 6;  // opl
  this.JXX          = 7;  // jXX
  this.CALL         = 8;  // call
  this.RET          = 9;  // ret
  this.PUSHL        = 10; // pushl
  this.POPL         = 11; // popl

  // Macro
  this.POS          = 12; // .pos
  this.ALIGN        = 13; // .align
  this.LONG         = 14; // .long
  this.SYMBOLDEF    = 15; // [symbol]:
  this.NUMBER       = 16; // 0x1,123,...TODO
  this.IMMEDIATELY  = 17; // $-1

  this.REGIS        = 18; // register(e.g. %eax)
  this.MREGIS       = 19; // to acess mem(e.g. 10(%eax))

  this.SYMBOLCIT    = 20; //
  
  this.PATTERN = [
      /^halt$/,
      /^nop$/,
      /^rrmovl$|^cmov[\w][\w]?$/,
      /^irmovl$/,
      /^rmmovl$/,
      /^mrmovl$/,
      /^addl$|^subl$|^xorl$|^andl$/,
      /^j[\w][\w]?/,
      /^call$/,
      /^ret$/,
      /^pushl$/,
      /^popl$/,

      /^\.pos$/,
      /^\.align$/,
      /^\.long$/,
      /^[\w]+:$/,
      /^(0x)[abcdef\d]+$|^\d+$/,
      /^\$[+\-]?\d+$/,

      /^%(e[abcd]x|e[sd]i|e[sb]p)$/,
      /^[+\-]?\d*\(%(e[abcd]x|e[sd]i|e[sb]p)\)$/,
    
      /^\w+$/
  ];
};

Assembler.prototype = {

  // load text, which is a string contain the assem code.
  loadAssem : function(text){
    this.text = text;
  },

  // example code
  exampleProgram: function(){
    this.text = exampleAssemCode;
  },


  proError : function(message){
    console.log(message);
  },

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

  getImmNumber: function(s){
    // 1. is symbol
    // 2. begin with $
    // 3. number
    // 4. maybe a null str
    // 5. 16 or 10 
    // return 4 bytes, e.g. [0xff,0x22,0x33,0xff]
    if (s == ''){
      return [0x00,0x00,0x00,0x00];
    }

    if (s[0] == '$') s = s.slice(1, s.length);
    var v = parseInt(s);
    if(v > 0x7fffffff || v < -0x7fffffff-1){
      this.proError("number too big");
      return [0x00,0x00,0x00,0x00];
    }
    return this.value2Word(v);
  },

  getRegister: function(s){
    if(s == "%eax") return 0;
    if(s == "%ecx") return 1;
    if(s == "%edx") return 2;
    if(s == "%ebx") return 3;
    if(s == "%esp") return 4;
    if(s == "%ebp") return 5;
    if(s == "%esi") return 6;
    if(s == "%edi") return 7;
    return 0xf;
  },
  
  proTokenSent: function(tokens, sentence){
    if(tokens[0] == this.SYMBOLDEF){

      // the symbol
      var sym = sentence[0];
      sym = sym.slice(0,sym.length-1);
      if(this.symbol_table[sym] === undefined) {
        this.symbol_table[sym] = this.code_pos; // save to table
      } else {
        this.proError("More than one defined symbol");
        return;
      }
      sentence = sentence.slice(1,sentence.length);
      tokens = tokens.slice(1, tokens.length);
    }

    var code_fun = 0x00;
    var rA       = 0xf;
    var rB       = 0xf;
    var inumber  = [0x00,0x00,0x00,0x00];
    var has_reg  = false;
    var has_inum = false;
    if (tokens[0] == this.HALT) {
      // halt
      code_fun = 0x00;
    } else if (tokens[0] == this.NOP) {
      // nop
      code_fun = 0x10;
    } else if (tokens[0] == this.RRMOVL) {
      // rrmovl
      rA = this.getRegister(sentence[1]);
      rB = this.getRegister(sentence[2]);
      has_reg = true;
      code_fun = 0x20;
    } else if (tokens[0] == this.IRMOVL){
      // TODO error process
      if(tokens[1] == this.IMMEDIATELY){
        inumber = this.getImmNumber(sentence[1]);
      }
      else{
        // symbol cite
        if(this.write_back[sentence[1]] != undefined) {
          this.write_back[sentence[1]].push(this.code_pos+2);
        } else {
          this.write_back[sentence[1]] = [this.code_pos+2];
        }
      }
      rB = this.getRegister(sentence[2]);
      has_reg = true;
      has_inum = true;
      code_fun = 0x30;
    } else if(tokens[0] == this.RMMOVL){
      //TODO error process
      rA = this.getRegister(sentence[1]);
      rB = this.getRegister(sentence[2].match(/%\w\w\w/)[0]);
      inumber = this.getImmNumber(sentence[2].match(/[+-]?\d+]/)[0]);
      has_reg = true;
      has_inum = true;
      code_fun = 0x40;
    } else if(tokens[0] == this.MRMOVL){
      rA = this.getRegister(sentence[2]);
      rB = this.getRegister(sentence[1].match(/%\w\w\w/)[0]);
      var add_v = sentence[1].match(/[+-]?\d+/);
      if(add_v != null)
        inumber = this.getImmNumber(add_v);
      has_reg = true;
      has_inum = true;
      code_fun = 0x50;
    } else if(tokens[0] == this.OPL){
      rA = this.getRegister(sentence[1]);
      rB = this.getRegister(sentence[2]);
      has_reg = true;
      if(sentence[0] == "addl") code_fun = 0x60;
      else if(sentence[0] == "subl") code_fun = 0x61;
      else if(sentence[0] == "andl") code_fun = 0x62;
      else if(sentence[0] == "xorl") code_fun = 0x63;
      else code_fun = 0x63;
    } else if(tokens[0] == this.JXX){
      if(tokens[1] == this.IMMEDIATELY){
        inumber = this.getImmNumber(sentence[1]);
      } else {
        if (this.write_back[sentence[1]] == undefined) {
          this.write_back[sentence[1]] = [this.code_pos+1];
        } else {
          this.write_back[sentence[1]].push(this.code_pos+1);
        }
      }
      has_inum = true;
      if(sentence[0] == "jmp") code_fun = 0x70;
      else if(sentence[0] == "jle") code_fun = 0x71;
      else if(sentence[0] == "jl") code_fun = 0x72;
      else if(sentence[0] == "je") code_fun = 0x73;
      else if(sentence[0] == "jne") code_fun = 0x74;
      else if(sentence[0] == "jge") code_fun = 0x75;
      else code_fun = 0x76;
    } else if(tokens[0] == this.CALL){
      if(tokens[1] == this.IMMEDIATELY){
        inumber = this.getImmNumber(sentence[1]);
      }
      else{
        // symbol cite
        if(this.write_back[sentence[1]] != undefined) {
          this.write_back[sentence[1]].push(this.code_pos+1);
        } else {
          this.write_back[sentence[1]] = [this.code_pos+1];
        }
      }
      has_inum = true;
      code_fun = 0x80;
    } else if(tokens[0] == this.RET){
      code_fun = 0x90;
    } else if(tokens[0] == this.PUSHL){
      rA = this.getRegister(sentence[1]);
      has_reg = true;
      code_fun = 0xa0;
    } else if(tokens[0] == this.POPL){
      rA = this.getRegister(sentence[1]);
      has_reg = true;
      code_fun = 0xb0;
    }

    if(tokens[0]>=0&&tokens[0]<=11){
      // this sentence is normal code
      this.code[this.code_pos] = code_fun;
      this.code_pos++;
      if(has_reg) {
        this.code[this.code_pos] = (rA<<4)|rB;
        this.code_pos ++;
      }
      if(has_inum) {
        this.code[this.code_pos] = inumber[3];
        this.code_pos ++;
        this.code[this.code_pos] = inumber[2];
        this.code_pos ++;
        this.code[this.code_pos] = inumber[1];
        this.code_pos ++;
        this.code[this.code_pos] = inumber[0];
        this.code_pos ++;
      }
      return;
    }

    // Macro
    if(tokens[0] == this.POS){
      inumber = this.getImmNumber(sentence[1]);
      inumber = this.word2Value(inumber);
      if(inumber>=0){
        this.code_pos = inumber;
      }else{
        this.proError("pos error");
        return;
      }
    }
    if(tokens[0] == this.ALIGN){
      inumber = this.getImmNumber(sentence[1]);
      inumber = this.word2Value(inumber);
      var align_number = inumber - (this.code_pos) % inumber;
      for(var i = 0; i<align_number; i++){
        this.code[this.code_pos] = 0x00;
        this.code_pos++;
      }
    }
    if(tokens[0] == this.LONG){
      inumber = this.getImmNumber(sentence[1]);
      for(i = 0;i<4;i++){
        this.code[this.code_pos + i] = inumber[3-i];
      }
      this.code_pos += 4;
    }
  },

  writeBack : function(){
    for (var key in this.write_back){
      if(this.symbol_table[key] == undefined){
        this.proError("symbol cite error");
        return;
      } else {
        var v = this.value2Word(this.symbol_table[key]);
        for (var i in this.write_back[key]){
          var p = this.write_back[key][i];
          this.code[p] = v[3];
          this.code[p+1] = v[2];
          this.code[p+2] = v[1];
          this.code[p+3] = v[0];
        }
      }
    }
  },

  proSentence : function(sentence){
    if (sentence == null) return;
    var tokens = [];
    for (var i = 0;i<sentence.length;i++){
      var w = sentence[i];
      var flag = false;
      for (var j = 0;j<this.PATTERN.length;j++){
        if (w.match(this.PATTERN[j]) != null){
          tokens.push(j);
          flag = true;
          break;
        }
      }
      if (flag == false) {
        // TODO
        this.proError("wrong sentence");
        return;
      }
    }
    this.proTokenSent(tokens, sentence);
  },

  appendZeros : function(){
    // because of the y86's bug maybe.
    // TODO
  },
  
  runAssem : function(){
    this.text = this.text.split("\n");
    var line_number = this.text.length;
    for (var i=0 ; i<line_number ; i++ ) {
      var line = this.text[i];
      var commentIdx = line.indexOf('#');
      if (commentIdx >= 0) { // has comment
        line = line.slice(0,commentIdx); // this is a line sentence
      }
      var strs = line.match(/[^\s,]+/g);
      this.proSentence(strs);
    }
    this.writeBack();
    //add some zeros,
    this.appendZeros();
    return this.code;
  }
};
