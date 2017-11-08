#!/usr/bin/python
# -*- coding: utf-8 -*-

# Marieke van Erp / marieke.van.erp@huygens.knaw.nl
# October  2017 

# This file tries to match the GS to the Illinois output 
# It's a bit more complicated than the booknlp2gs.py script as the Illinois tagger
# messes up the tokenisation so an extra check is built in. 

import sys 

# Open the Gold Standard File 
gs_tokens = []
gs_tags = []  
# open a *gs file
with open(sys.argv[1], 'r') as f:
#with open("New/HarryPotter.gs", 'r') as f:
	for line in f: 
		line = line.rstrip()
		elems = line.split(" ")
		gs_tokens.append(elems[0])
		gs_tags.append(elems[1])
f.close()

# open a corresponding /Users/marieke/Downloads/Out-with-1/BookNLPOutput/*/*tokens file  
#with open(sys.argv[2], 'r') as f:
ill_tags = [] 
ill_tokens = [] 
with open(sys.argv[2], 'r') as f:
#with open("New/HarryPotter.illoutput", 'r') as f:
	for line in f:
		line = line.rstrip()
		elems = line.split(" ")
		if elems[1] == "PER":
			elems[1] = "I-PERSON"
		ill_tags.append(elems[1])
		ill_tokens.append(elems[0])
f.close()


for idx, val in enumerate(gs_tokens):
	if gs_tokens[idx] == ill_tokens[idx]:
		print(gs_tokens[idx], gs_tags[idx], ill_tokens[idx], ill_tags[idx])
		#pass
	elif gs_tokens[idx] == "`" and ill_tokens[idx] == "'":
		print(gs_tokens[idx], gs_tags[idx], ill_tokens[idx], ill_tags[idx])
		#print(gs_tokens[idx], gs_tags[idx], ill_tokens[idx+1], ill_tags[idx+1])
	elif gs_tokens[idx] == "..." and ill_tokens[idx] == "..":
		print(gs_tokens[idx], gs_tags[idx], ill_tokens[idx], ill_tags[idx])
	elif gs_tokens[idx] == "-LRB-" and ill_tokens[idx] == "(":
		print(gs_tokens[idx], gs_tags[idx], ill_tokens[idx], ill_tags[idx])
	elif gs_tokens[idx] == "-RRB-" and ill_tokens[idx] == ")":
		print(gs_tokens[idx], gs_tags[idx], ill_tokens[idx], ill_tags[idx])
	elif gs_tokens[idx] == "||" and ill_tokens[idx] == "place": # Hack for Magicians line 2443
		gs_tokens.pop(idx)
		gs_tags.pop(idx)
	elif gs_tokens[idx] == "||" and ill_tokens[idx] == "and": # Hack for Magicians line 2443
		gs_tokens.pop(idx)
		gs_tags.pop(idx)
	elif gs_tokens[idx] == ill_tokens[idx+1]:
		print(gs_tokens[idx], gs_tags[idx], ill_tokens[idx+1], ill_tags[idx+1])
		ill_tokens.pop(idx)
		ill_tags.pop(idx)
	else:	
		print(idx, gs_tokens[idx], gs_tags[idx], ill_tokens[idx], ill_tags[idx])


		
		
	 
		
				  
		