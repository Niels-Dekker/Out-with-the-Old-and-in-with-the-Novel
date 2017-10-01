import sys
import os
import glob
import csv
from collections import defaultdict
csv.field_size_limit(sys.maxint)

annonew = 'H:\Dropbox\University\Workspace\Master\Excel Files\New\Test'
bammannew = 'H:\Dropbox\University\Workspace\Master\BammanProcessed\New\Test'
# 
annoold ='H:\Dropbox\University\Workspace\Master\Excel Files'
bammanold = 'H:\Dropbox\University\Workspace\Master\BammanProcessed\Old\Test'
#  
# annonew = annoold
# bammannew = bammanold

anno_super_list = []
bamman_super_list = []
sentence_super_list = []
name_list = []
anno_doc_lengths = []
default_super_list = []
unique_persons_super = []
evaluation_dict = defaultdict(list)
all_persons_dict = defaultdict(set)
all_mentions_dict = defaultdict(list)

def ReadAnnotationDocuments():
    for annodocument in glob.glob(os.path.join(annonew, '*.txt')):
        annodict = defaultdict(set)
        f = open(annodocument)
        annoname = "".join(annodocument.rsplit(annonew))
        annoname2 = annoname.split('.')[0]
        name_list.append(annoname2)  
        annoreader = csv.reader(f, dialect ="excel-tab")
        next(annoreader, None) #skip header
        
        rows = 1
        
        unique_persons = set()
        default_list = [0, 0]
        for row in annoreader:
            rows += 1
            default_list[0] += int(row[1])
            for i in range(1, int(row[1])+1, 1): #exclude sentences without mentions
                if(row[i+1] != '#N/A'):
                    unique_persons.add(int(row[i+1]))
                if(row[i+1] != '999'): #DEFAULTS
                    annodict[row[0]].add(row[i+1])
                elif(row[i+1] == '999'):
                    default_list[1] += 1
                    
                    
        f.close()
        unique_persons_super.append(unique_persons)
        default_super_list.append(default_list)
        anno_super_list.append(annodict)
        anno_doc_lengths.append(rows)

def ReadBammanDocuments():   
    for bammandocument in glob.glob(os.path.join(bammannew, '*.tokens')):  
        bammandict = defaultdict(set)
        sentencedict = defaultdict(int)
        f2 = open(bammandocument)
        bammanname = "".join(bammandocument.rsplit(bammannew))
        bammanname2 = bammanname.split('.')[0]
        bammanreader = csv.reader(f2, dialect ="excel-tab")
        
        for row in bammanreader:
            if ((row[11] == "PERSON" or row[11] == "O") and row[14] != "-1"):
                bammandict[row[1]].add(row[14])
            sentencedict[row[1]]+= 1
                
        f2.close()
        bamman_super_list.append(bammandict)
        sentence_super_list.append(sentencedict)

def PrecisionRecall(name, annodict, bammandict):
    annodictlen = float(len(annodict))
    avgrecall = 0
    avgprecision = 0
    for key in annodict:
        if key in bammandict:
            shared_elements = annodict[key] & bammandict[key]
            recall = len(shared_elements) / float(len(annodict[key]))
            precision = len(shared_elements) / float(len(bammandict[key]))
            avgrecall += recall
            avgprecision += precision 
#             print(key, annodict[key], bammandict[key], precision, recall)

    evaluation_dict[name].append(avgprecision/annodictlen)
    evaluation_dict[name].append(avgrecall/annodictlen)

def AverageSentenceLength(name, sentencedict):
    total_amount_of_words = 0
    for sentencekey in sentencedict:
        total_amount_of_words += sentencedict[sentencekey]
    avg_sentence_length = total_amount_of_words/float(len(sentencedict))
    evaluation_dict[name].append(avg_sentence_length)

def PersonsPerSentence(name, anno, lengths):
    number_of_mentions = 0.0
    for sentence in anno:
        number_of_mentions += len(anno[sentence]) 
    avg_person_per_sentence = number_of_mentions / float(len(anno))
    evaluation_dict[name].append(avg_person_per_sentence)
    evaluation_dict[name].append(number_of_mentions/lengths)
    
def FractionOfDefaults(name, defaults):
    evaluation_dict[name].append(defaults[1]/float(defaults[0]))

def UnidentifiedPersons(name, persons):
    number_of_persons = len(persons)
    number_of_unidentified_persons = 0
    for i in persons:
        if( i >= 1000):
            number_of_unidentified_persons += 1
    evaluation_dict[name].append(number_of_unidentified_persons/float(number_of_persons))
    
def AmountOfUniquePersons(name, bamman):
    for sentence in bamman.values():
        for person in sentence:
            all_persons_dict[name].add(person)
    print name, len(all_persons_dict[name])

def AmountOfPersonMentions(name, bamman):
    for sentence in bamman.values():
        for person in sentence:
            all_mentions_dict[name].append(person)
    print name, len(all_mentions_dict[name])

def Evaluate():
    for name, anno, bamman, sentences, lengths, defaults, persons in zip(name_list, anno_super_list, bamman_super_list, sentence_super_list, anno_doc_lengths, default_super_list, unique_persons_super):
        PrecisionRecall(name, anno, bamman)
        AverageSentenceLength(name, sentences)
        PersonsPerSentence(name, anno, lengths)
        FractionOfDefaults(name, defaults)
        UnidentifiedPersons(name, persons)
        AmountOfUniquePersons(name, bamman)
        AmountOfPersonMentions(name, bamman)
        print name, evaluation_dict[name][0], evaluation_dict[name][1], evaluation_dict[name][2], evaluation_dict[name][3], evaluation_dict[name][4], evaluation_dict[name][5], evaluation_dict[name][6]
        unused = name, evaluation_dict[name][0], evaluation_dict[name][1], evaluation_dict[name][2], evaluation_dict[name][3], evaluation_dict[name][4], evaluation_dict[name][5]
        
ReadAnnotationDocuments()
ReadBammanDocuments()
Evaluate()