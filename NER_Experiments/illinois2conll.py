#!/usr/bin/python
# -*- coding: utf-8 -*-

# Marieke van Erp / marieke.van.erp@huygens.knaw.nl
# October  2017 

import sys 

# Illinois NER bracket output format to conll 

switch = 0 
with open(sys.argv[1], 'r') as f:
	for line in f:
		line = line.rstrip()
		elems = line.split(" ")
		for elem in elems:
			if '[PER' in elem:
				switch = 1
				continue
			if '[ORG' in elem:
				switch = 2
				continue
			if '[LOC' in elem:
				switch = 3
				continue
			if '[MISC' in elem:
				switch = 4
				continue
			elif ']' in elem and switch == 1:
				print(elem[:-1], 'PER')
				switch = 0
			elif ']' in elem and switch == 2:
				print(elem[:-1], 'ORG')
				switch = 0
			elif ']' in elem and switch == 3:
				print(elem[:-1], 'LOC')
				switch = 0
			elif ']' in elem and switch == 4:
				print(elem[:-1], 'MISC')
				switch = 0
			elif switch == 1:
				print(elem, 'PER')
			elif switch == 2:
				print(elem, 'ORG')
			elif switch == 3:
				print(elem, 'LOC')
			elif switch == 4:
				print(elem, 'MISC')
			elif switch == 0:
				print(elem, "O")