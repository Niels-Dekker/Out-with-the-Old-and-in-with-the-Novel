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

testsentence = "Logan Gyre was sitting in the mud and blood of the battlefield of Pavvil's Grove when Terah Graesin came to him. It was barely an hour since they'd routed the Khalidorans, when the monstrous ferali forged to devour Cenaria's army had turned instead on its Khalidoran masters. Logan had issued the orders that seemed most pressing, then dismissed everyone to join the revelries that were sweeping the Cenarian camp. Terah Graesin came to him alone. He was sitting on a low rock, heedless of the mud. His fine clothes were so spattered with blood and worse they were a total loss anyway. Terah's dress, by contrast, was clean except for the lower fringe. She wore high shoes, but even those couldn't keep her entirely free of the thick mud. She stopped before him. He didn't stand." 
bla = sent_tokenize(testsentence)
#wr = csv.writer(myfile, quoting=csv.QUOTE_ALL)

def WriteSentenceGroups(filename,sentences):
    sentencegroups = []
    file = open(filename, 'wb')
    wr = csv.writer(file, delimiter='~', quotechar = "|", quoting=csv.QUOTE_ALL)
    
    for i in range(0,len(sentences)):
        if(i < len(sentences) - 2):
            my_sentences = [sentences[i],sentences[i+1],sentences[i+2]]
            sentencegroups.append(my_sentences)
            wr.writerow(my_sentences)
    file.close()

WriteSentenceGroups("TimmyTurner",bla)
WriteSentenceGroups("Dick",bla)
WriteSentenceGroups("Toim",bla)