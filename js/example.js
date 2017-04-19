// GNU GENERAL PUBLIC LICENSE
// Copyright (c) 2017 Zhenhuan Ouyang
// oyzh@zju.edu.cn

var exampleAssemCode = "\
\n      .pos 0\n\
init:   irmovl Stack, %esp # Set up stack pointer\n\
        irmovl Stack, %ebp # Set up base pointer\n\
        call Main          # Excute main program\n\
        halt               # Terminate program\n\
\n     .align 4 \n\
array: .long 0xd \
\n     .long 0xc0 \
\n     .long 0xb00 \
\n     .long 0xa000 \
\n\
Main:   pushl %ebp \n\
        rrmovl %esp,%ebp \n\
        irmovl $4,%eax \n\
        pushl %eax        # Push 4 \n\
        irmovl array,%edx \n\
        pushl %edx        # Push array \n\
        call Sum          # Sum(array, 4) \n\
        rrmovl %ebp,%esp \n\
        popl %ebp \n\
        ret \n\
\n\
        # int Sum(int *Start, int Count) \n\
Sum:    pushl %ebp \n\
        rrmovl %esp,%ebp \n\
        mrmovl 8(%ebp),%ecx  # ecx = Start \n\
        mrmovl 12(%ebp),%edx # edx = Count \n\
        xorl %eax,%eax       # sum = 0 \n\
        andl %edx,%edx       # Set condition codes \n\
        je End \n\
Loop:   mrmovl (%ecx),%esi   # get *Start \n\
        addl %esi,%eax       # add to sum \n\
        irmovl $4,%ebx \n\
        addl %ebx,%ecx       # Start++ \n\
        irmovl $-1,%ebx \n\
        addl %ebx,%edx       # Count-- \n\
        jne Loop             # Stop when 0 \n\
End:    rrmovl %ebp,%esp \n\
        popl %ebp \n\
        ret \
\n      .pos 0x100 \n\
Stack: \n";


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

