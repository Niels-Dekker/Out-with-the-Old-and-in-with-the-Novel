#!/usr/bin/python
# -*- coding: utf-8 -*-

# Marieke van Erp / marieke.van.erp@huygens.knaw.nl
# October  2017 
# This script reads in a conll-output file and matches it up with the 
# gold standard file. It outputs conll format for evaluation using conlleval.pl

import sys

#gsfile = sys.argv[1]
gsfile = sys.argv[1] # Should be a tsv file of the form "sentence\tcharacter1\tcharacter2"
gs_terms = [] 
line_counter = 0
entitylog = open("logfile.log", "a")
with open(gsfile, 'r') as f:
	for line in f:
		ne_counter = 0 
		line_counter = line_counter + 1 
		line = line.rstrip()
		elems = line.split("\t")
		nes = elems[1:]
		nes_hash = {}
		found_hash = {}
		for x in nes:
			if x == 'DEFAULT':
				nes.remove(x)
			else:
				x = x.rstrip()
				nes_hash[x] = 1
		elems[0] = elems[0].lstrip('|')
		elems[0] = elems[0].rstrip('|')
		elems[0] = elems[0].rstrip()
		for ne in nes_hash:
			netag = ne.replace(" ","PERSON ")
			netag = netag + "PERSON"
			if ne in elems[0]:
				elems[0] = elems[0].replace(ne, netag)
				ne_counter = ne_counter + 1 
				found_hash[ne] = 1 
			elif " " in ne:
				ne_elems = ne.split(" ")
				for ne_elem in ne_elems:
					if ne_elem in elems[0]:
						elems[0] = elems[0].replace(ne_elem, ne_elem+"PERSON")
						ne_counter = ne_counter + 1
						found_hash[ne_elem] = 1 
		words = elems[0].split(" ")
		if len(nes_hash) > len(found_hash): 	
			entitylog.write(sys.argv[1] + " " + str(line_counter) + " " + str(nes_hash) + " " + str(found_hash) + "\n") 
		for word in words:
			if "PERSON" in word:
				word = word.replace("PERSON","\tPERSON")
				# dirty hack to fix up 's getting attached to the PERSON tag 
				word_elems = word.split("\tPERSON")
				cleanword = "".join(word_elems) + "\tI-PERSON"
				word = cleanword
			else:
				word = word + "\tO"
			gs_terms.append(word)
			#print(word)
#gsfile.close()

taggedfile = sys.argv[2]
tagged_terms = []
with open(taggedfile, 'r') as f:
	for line in f:
		line = line.rstrip()
		tagged_terms.append(line)
#taggedfile.close()

#print(sys.argv[1],len(tagged_terms), len(gs_terms))


for idx, val in enumerate(gs_terms):
	gs_elems = gs_terms[idx].split("\t")
	tagged_elems = tagged_terms[idx].split("\t")
	if len(tagged_elems[1]) > 2:
		tagged_elems[1] = "I-"+tagged_elems[1]
	print(gs_elems[0], gs_elems[1], tagged_elems[1])

				

		
			