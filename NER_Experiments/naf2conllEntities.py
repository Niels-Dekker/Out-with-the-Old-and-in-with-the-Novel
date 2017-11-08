#!/usr/bin/python
# -*- coding: utf-8 -*-

# Marieke van Erp / marieke.van.erp@huygens.knaw.nl
# October  2017 
# This is a script to read in the naf output from the ixa pipes NLP tool
# It extracts the NEs and outputs a conll-format. 

from KafNafParserPy import *
import sys
import re 
import urllib 
import datetime

infile = sys.argv[1]
my_parser = KafNafParser(infile)

# Gather all words 
words = {}
for word in my_parser.get_tokens():
	words[word.get_id()] = word.get_text()

# Gather all terms 
terms = {}
sent = {} 
for term in my_parser.get_terms():
	terms[term.get_id()] = ""
	for span in term.get_span():
		#print(span.get_id(), term.get_id())
		try:
			terms[term.get_id()] =  terms[term.get_id()] + words[span.get_id()] + " "
		except:
			pass

# get entities and store them into a dictionary  
spans = {}	
entity_mention = {} 
entity_type = {}
entity_index = {}
for entity in my_parser.get_entities():
	entity_type[entity.get_id()] = entity.get_type()	
	for reference in entity.get_references():
		idx = 0
		for span in reference.get_span():
			entity_index[span.get_id()] = entity.get_id()
			
#for entity in entity_index:
#	print(entity, entity_index[entity])
	
for x in range(1, len(terms)+1):
	tid = "t"+str(x)
	if tid in entity_index:
		print(terms[tid] + "\t" + entity_type[entity_index[tid]])
	else:
		print(terms[tid] + "\tO") 
