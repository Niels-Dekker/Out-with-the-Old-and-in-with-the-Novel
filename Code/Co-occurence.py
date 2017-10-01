import nltk.tag.stanford as st
from nltk import sent_tokenize
from pprint import pprint
import nltk
import yaml
import sys
import os
import re
import glob
import io
import time
import csv
import numpy as np

import networkx as nx
import matplotlib.pyplot as plt
import graphviz

from collections import defaultdict
from SentenceSplitter import WriteSentenceGroups
from itertools import product

csv.field_size_limit(sys.maxint)


pathnew = 'H:\Dropbox\University\Workspace\Master\BammanProcessed\New\Completed'
pathold = 'H:\Dropbox\University\Workspace\Master\BammanProcessed\Old\Completed'

pathnew= pathold

newdict = {}
olddict = {}

"""
--- Reconstruct names for person ID
--- Ensure bi-directional connections add up

--- Compare annotations to system output

for each sentence:
    compare how many persons co-occur
    compare how many of those are correctly identified


"""
#--- Handle co-occurences of more than 2
#--- Handle weights for each edge




for document in glob.glob(os.path.join(pathnew, '*.tokens')):
    
    sentencedict = defaultdict(set)
    edgesdict = defaultdict(int)
    edges = []
    G = nx.Graph()

    print document
    f = open(document)
    bookname = "".join(document.rsplit(pathnew))
    bookname2 = bookname.split('.')[0]
    
    reader = csv.reader(f, dialect ="excel-tab")
    
    
    
    '''add personID's to sentence'''
    for row in reader:
        if ((row[11] == "PERSON" or row[11] == "O") and row[14] != "-1"):
            sentencedict[row[1]].add(row[15])
    f.close()
    print(sentencedict)
    
    '''exclude sentences with only 1 person'''
    for sentence in sentencedict.items():
        if len(sentence[1]) <= 1:
            del sentencedict[sentence[0]]
            
    '''Enter edges if only 2 persons in 1 sentence'''
    for sentence in sentencedict.items():
        sentencelist = list(sentence[1])
        if len(sentencelist) == 2:
            edges.append(sentencelist)
            
        #Enter edges if more than 2 persons in 1 sentence
        elif(len(sentencelist) >= 3):
            list1 = sentencelist
            list2 = sentencelist
            matrix = list(product(list1, list2))
            
            '''Discard connections with self'''
            new_matrix = []
            for i in matrix:
                if not i[0] == i[1]:
                    new_matrix.append(i)
            
            '''Sort each pair to eliminate directional duplicates'''
            sorted_new_matrix = [list(x) for x in new_matrix]
            set_of_pairs = set()
            for i in sorted_new_matrix:
                sorted_i = sorted(i)
                set_of_pairs.add(tuple(sorted_i))
            
            '''Add newly found unique connections to edge-array'''
            for i in set_of_pairs:
                edges.append(list(i))

        '''Calculate edge-weights'''
    for edge in edges:
        edgesdict[tuple(edge)] += 1
        
        '''Add edges to network'''
    for edge in edgesdict.items():
        person1 = edge[0][0]
        person2 = edge[0][1]
        weight = edge[1]
        G.add_edge(person1, person2, weight=weight)

    '''Write network file'''
    nx.write_gexf(G, bookname2 + '.gexf')
