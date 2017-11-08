#!/usr/bin/python
# -*- coding: utf-8 -*-

# Marieke van Erp / marieke.van.erp@huygens.knaw.nl
# October  2017 

import sys 

# Open the Gold Standard File 
gs_tokens = []
gs_tags = []  
# open a *gs file
with open(sys.argv[1], 'r') as f:
#with open("/Users/marieke/Downloads/Out-with-the-Old-and-in-with-the-Novel/Annotations/New/Magician.conll", 'r') as f:
	for line in f: 
		line = line.rstrip()
		elems = line.split(" ")
		gs_tokens.append(elems[0])
		gs_tags.append(elems[1])
f.close()

# open a corresponding /Users/marieke/Downloads/Out-with-1/BookNLPOutput/*/*tokens file 
counter = -1 
with open(sys.argv[2], 'r') as f:
#with open("/Users/marieke/Downloads/Out-with-1/BookNLPOutput/New/Magicianv2.tokens", 'r') as f:
	for line in f:
		line = line.rstrip()
		if "paragraphId" in line:
			continue
		counter = counter + 1
		elems = line.split("\t")
		word = elems[7]
		ne_tag = elems[11]
		if len(ne_tag) > 2:
			ne_tag = "I-"+ ne_tag
		if counter >= len(gs_tokens):
			exit()
		print(gs_tokens[counter], gs_tags[counter], ne_tag)
		#print(word, gs_tokens[counter], gs_tags[counter], ne_tag, counter)
	 
		
		
# Check alignments New:
# Game of Thrones  
# The Wheel of Time 

		 	


