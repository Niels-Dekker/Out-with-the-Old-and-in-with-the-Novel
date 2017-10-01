import sys
import os
import glob
import csv
from collections import defaultdict

from SentenceSplitterV2 import WriteSentenceGroups

csv.field_size_limit(sys.maxint)

pathnew = 'H:\Dropbox\University\Workspace\Master\BammanProcessed\New\Completed'
pathold = 'H:\Dropbox\University\Workspace\Master\BammanProcessed\Old\Test'

pathnew = pathold

'''Reconstruct sentences from .tokens for annotation'''

anno_super_dict = {}
bamman_super_dict = {}
 
for document in glob.glob(os.path.join(pathnew, '*.tokens')):
    sentencedict = defaultdict(str)
    persondict = defaultdict(set)
      
    f = open(document)
    reader = csv.reader(f, dialect ="excel-tab")
    newbook = "".join(document.rsplit(pathnew))
    newbook2 = newbook.split('.')[0]
      
    rownumber = 0
    for row in reader:
        if(rownumber >= 1):
            sentencedict[int(row[1])] += (row[8] + ' ')
            if (row[11] == "PERSON" and row[14] != "-1"):
                persondict[row[14]].add(row[7])
        rownumber += 1  
          
    sentences = sentencedict.values()
    
    print(' ')
    print newbook2
    print(' ')
    
    for person in persondict.items():
        that_person = ''
        for word in persondict[person[0]]:
            that_person += word + ' '
        print person[0],':', that_person
    
    #WriteSentenceGroups(newbook2, sentences)
  
    f.close()

# for document in glob.glob(os.path.join(pathold, '*.tokens')):
#     sentencedict = defaultdict(str);
#      
#     f = open(document)
#     reader = csv.reader(f, dialect ="excel-tab")
#     oldbook = "".join(document.rsplit(pathold))
#     oldbook2 = oldbook.split('.')[0]
#      
#     rownumber = 0
#     for row in reader:
#         if(rownumber >= 1):
#             sentencedict[int(row[1])] += (row[8] + ' ')
#         rownumber += 1  
#          
#     sentences = sentencedict.values()
#     for i in sentences:
#         print(i)
#  
#     WriteSentenceGroups(oldbook2, sentences)
#  
#     f.close()
