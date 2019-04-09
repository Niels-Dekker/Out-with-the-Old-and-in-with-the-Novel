# Evaluating named entity recognition tools for extracting social networks from novels

This Github repository contains the code and experiments for the paper "Evaluating named entity recognition tools
for extracting social networks from novels" by Niels Dekker, Marieke van Erp & Tobias Kuhn.

Please cite if you write a research paper using these resources: http://peerj.com/articles/cs-189.

Contact: niels.m.dekker@gmail.com  
Last updated: 9 April 2019

<img src="/Visualisations/GameOfThrones.png" alt="GoT Social Network"/>

For the interactive visualisation created using D3.js, please visit https://blog.trifork.com/wp-content/uploads/got/.

Prerequisites:

* Python 3
   * [KafNafParserPy](https://github.com/cltl/KafNafParserPy)  
   * [NetworkX](https://networkx.github.io)
* [BookNLP commit 81d7a31](https://github.com/dbamman/book-nlp)
* [IXA-PIPE-NERC version 1.1.1](http://ixa2.si.ehu.es/ixa-pipes/)
* [Stanford NER version 3.8.0 (2017-06-09](https://nlp.stanford.edu/software/stanford-ner-2017-06-09.zip) 
* [Illinois NE Tagger version 3.0.23](https://cogcomp.org/page/software_view/NETagger)
* [CoNLL NER evaluation script](https://www.clips.uantwerpen.be/conll2002/ner/bin/conlleval.txt)
* [Gephi](https://gephi.org)

Directory listing:  

- Annotations: contains the gold standard annotations as described in Section 3 of the paper 
- NER_experiments: contains the scripts and data to replicate the experiments described in Section 4
- Networks: contains the code and resulting networks described in Section 5 
- Visualisations: contains higher resolution versions of Figures 1, 3 and 4 

 
 


