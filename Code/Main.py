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

from SentenceSplitter import WriteSentenceGroups


pathnew = 'C:\Users\Niels\Dropbox\University\Workspace\Master\New'
pathold = 'C:\Users\Niels\Dropbox\University\Workspace\Master\Old'

anno_super_dict = {}
bamman_super_dict = {}

for document in glob.glob(os.path.join(pathnew, '*.txt')):
    f = io.open(document,encoding="utf-8-sig")
    newbook = "".join(document.rsplit(pathnew))
    newbook2 = newbook.split('.')[0]
    sentences = sent_tokenize(f.read())
    total_sentences = len(sentences)
    print (newbook2, total_sentences)
#     WriteSentenceGroups(newbook2, sentences)
    anno_super_dict[newbook] = total_sentences
    f.close()

for document in glob.glob(os.path.join(pathold, '*.txt')):
    f = io.open(document,encoding="utf-8-sig")
    oldbook = "".join(document.rsplit(pathold))
    oldbook2 = oldbook.split('.')[0]
    sentences = sent_tokenize(f.read())
    total_sentences = len(sentences)
#     WriteSentenceGroups(oldbook2, sentences)
    bamman_super_dict[oldbook] = total_sentences
    f.close()


avgnew = 0
for nrsentences in anno_super_dict.values():
    avgnew += nrsentences
avgnew = avgnew/len(anno_super_dict)
    
avgold = 0
for nrsentences in bamman_super_dict.values():
    avgold += nrsentences
avgold = avgold/len(bamman_super_dict)
