the Computer Systems A Programmer's Perspective.

Y86 is a instructions set, which is very small, but it is enough to write a complement program. 

+ instructions
  - halt
  - nop
  - rrmovl rA, rB
  - irmovl V, rB
  - mrmovl rA, D(rB)
  - OPl rA, rB
  - jXX Dest
  - cmovXX rA, rB
  - call Dest
  - ret
  - pushl rA
  - popl rA
  
I use the JavaScript to build the machine, and I also implement a assembler for it.

IT JUST RUN.

+ LICENCE

  GNU GENERAL PUBLIC LICENSE
  
+ AUTHOR

  Zhenhuan Ouyang
