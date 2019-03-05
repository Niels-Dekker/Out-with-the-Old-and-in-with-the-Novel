#!/usr/bin/python
# -*- coding: utf-8 -*-

# Niels Dekker / niels.m.dekker@gmail.com
# October  2017 

import pandas as pd
import os
import networkx as nx
import subprocess
from collections import defaultdict
from itertools import product
import matplotlib.pyplot as plt
import csv
from tqdm import tqdm
from sklearn.base import TransformerMixin, BaseEstimator
tqdm.pandas()


class NetworkExtractor(BaseEstimator, TransformerMixin):
    """
    A class to obtain network features from raw texts.
    Assumes a pre-installed version of BookNLP to call in subprocess.
    Can be used in combination with sklearn pipelines.
    """

    def __init__(self):
        self.prepositions = ['he', 'she', 'it']

    def fit(self, df, y=None):
        return self

    def transform(self, df, y=None):
        df[['number_of_nodes',
            'number_of_edges',
            'avg_degree',
            'avg_weighted_degree',
            'avg_shortest_path',
            'avg_centrality',
            'density',
            'communities']] = df.progress_apply(lambda row: self.calculate_network_features(row), axis=1,
                                                result_type='expand')
        return df

    def calculate_network_features(self, row):
        graph = self.construct_network(row)
        self.G = graph
        number_of_nodes = len(graph)
        number_of_edges = nx.number_of_edges(graph)
        avg_degree = sum(dict(graph.degree()).values()) / number_of_nodes
        avg_weighted_degree = sum(dict(graph.degree(weight='weight')).values()) / number_of_nodes
        avg_shortest_path = self.average_shortest_path_length_for_all(graph)
        avg_centrality = sum(nx.eigenvector_centrality(graph).values()) / number_of_nodes
        density = nx.density(graph)
        communities = len(nx.algorithms.community.modularity_max.greedy_modularity_communities(graph))
        return [number_of_nodes, number_of_edges, avg_degree, avg_weighted_degree, avg_shortest_path, avg_centrality,
                density, communities]

    def construct_network(self, row):
        document_path = row['filepath']
        book_name = os.path.basename(document_path).split('.txt')[0].lower()
        tokens = 'data/tokens/' + book_name + ".tokens"
        command = "./runjava novels/BookNLP -doc " + document_path + " -p data/output/" + book_name + " -tok " + tokens + " -f"
        if not os.path.isfile(tokens):
            subprocess.check_call(command, shell=True)

        book_nlp_df = pd.read_csv(tokens, sep='\t', encoding='utf-8-sig', quoting=csv.QUOTE_NONE)
        character_df = self.create_character_names(book_nlp_df)
        sentence_dict = self.construct_interactions(character_df)
        edges = self.construct_edge_array(sentence_dict)
        edges_dict = self.calculate_edge_weights(edges)
        graph = self.add_edges_to_network(edges_dict)
        return graph

    def create_character_names(self, df):
        character_dict = defaultdict(set)
        character_names = defaultdict(str)
        character_df = df[df['characterId'] != -1]

        for index, row in character_df.iterrows():
            if ((not row['lemma'] in self.prepositions) and (not pd.isna(row['lemma']))):
                character_dict[row['characterId']].add(row['lemma'].capitalize())

        for key, value in character_dict.items():
            character_names[key] = ' '.join(list(value))

        character_df['character_name'] = character_df['characterId'].map(character_names)
        return character_df

    @staticmethod
    def construct_interactions(character_df):
        sentence_dict = defaultdict(set)
        for index, row in character_df.iterrows():
            sentence_dict[row['sentenceID']].add(row['character_name'])
        return sentence_dict

    @staticmethod
    def remove_lonely_people(sentence_dict):
        for key, value in list(sentence_dict.items()):
            if len(value) <= 1:
                del sentence_dict[key]
        return sentence_dict

    @staticmethod
    def construct_edge_array(sentence_dict):
        edges = []

        for sentence in sentence_dict.items():
            sentencelist = list(sentence[1])
            if len(sentencelist) == 2:
                edges.append(sentencelist)

            elif (len(sentencelist) > 2):
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
        return edges

    @staticmethod
    def calculate_edge_weights(edges):
        edges_dict = defaultdict(int)
        for edge in edges:
            edges_dict[tuple(edge)] += 1

        return edges_dict

    @staticmethod
    def add_edges_to_network(edges_dict):
        G = nx.Graph()
        for edge in edges_dict.items():
            person1 = edge[0][0]
            person2 = edge[0][1]
            weight = edge[1]
            G.add_edge(person1, person2, weight=weight)
        return G

    @staticmethod
    def average_shortest_path_length_for_all(G):
        tempgraph = G.copy()
        if nx.is_connected(tempgraph):
            average = nx.average_shortest_path_length(tempgraph)
        else:
            '''Try to see if the graph is not connected because of isolated nodes'''
            tempgraph.remove_nodes_from(nx.isolates(tempgraph))
            if nx.is_connected(tempgraph):
                '''Compute the graph average path without isolated nodes'''
                average = nx.average_shortest_path_length(tempgraph)
            else:
                '''Compute the average shortest path for each subgraph and mean it!'''
                subgraphs = nx.connected_component_subgraphs(tempgraph)
                average = 0
                for sb in subgraphs:
                    average += nx.average_shortest_path_length(sb)
                average /= nx.number_connected_components(tempgraph)
        return average

    def write_for_gephi(self, path):
        nx.write_gexf(self.G, path + '.gexf')

    def write_for_cyto(self, path):
        nx.write_graphml(self.G, path + '.xml')

    def visualise(self):
        nx.draw_networkx(self.G)
        plt.show()