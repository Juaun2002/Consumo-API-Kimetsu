'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

// 1. DEFINIÇÃO DAS INTERFACES (TIPAGEM)
// Define a "forma" dos dados que esperamos receber da API para garantir a segurança de tipo.

/**
 * Representa um único Pokémon na lista.
 */
export interface Pokemon {
  id: number;
  name: string; // Nome do Pokémon
  url: string; // URL para os detalhes completos
  imageUrl: string; // URL da imagem do Pokémon
  types: { type: { name: string } }[];
  weight: number;
  base_experience: number;
}

/**
 * Representa a estrutura da resposta da API para a lista de Pokémon.
 */
interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: { name: string; url: string }[]; // A lista inicial não tem imageUrl
}

/**
 * Representa a estrutura da resposta de detalhes de um Pokémon (apenas o que precisamos).
 */
interface PokemonDetailsResponse {
  id: number;
  sprites: {
    front_default: string;
  };
  types: { type: { name: string } }[];
  weight: number;
  base_experience: number;
}

// 2. CONFIGURAÇÃO DO AXIOS
// Criamos uma instância do Axios com a URL base da PokeAPI para não repetir em toda chamada.
const pokeApi = axios.create({
  baseURL: 'https://pokeapi.co/api/v2/',
});

// 3. CUSTOM HOOKS E FUNÇÕES

/**
 * Hook customizado para buscar uma lista de Pokémon com suas imagens.
 * Ele gerencia os estados de carregamento (loading), erro (error) e os dados (pokemonList).
 * @param limit - O número de Pokémon a serem buscados. Padrão é 151.
 * @returns Um objeto com a lista de Pokémon, o estado de carregamento e possíveis erros.
 */
export function usePokemonList(limit: number = 151) {
  // Estado para armazenar a lista de Pokémon. Inicia com um array vazio.
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  // Estado para controlar se a busca está em andamento.
  const [loading, setLoading] = useState<boolean>(true);
  // Estado para armazenar mensagens de erro, caso ocorram.
  const [error, setError] = useState<string | null>(null);

  // useEffect é usado para executar a busca de dados quando o componente é montado
  // ou quando a dependência (neste caso, 'limit') muda.
  useEffect(() => {
    // Função assíncrona para realizar a busca.
    async function loadPokemon() {
      try {
        // Inicia a busca: define loading como true e limpa erros anteriores.
        setLoading(true);
        setError(null);

        // 1. Busca a lista inicial de Pokémon (que contém nome e URL de detalhes).
        const listResponse = await pokeApi.get<PokemonListResponse>('pokemon', {
          params: { limit },
        });

        // 2. Para cada Pokémon na lista, cria uma "promessa" para buscar seus detalhes.
        const pokemonDetailsPromises = listResponse.data.results.map(async (pokemon) => {
          // Usa o axios para buscar os detalhes a partir da URL específica do Pokémon.
          const detailsResponse = await axios.get<PokemonDetailsResponse>(pokemon.url);
          // Retorna um novo objeto com os dados que queremos: nome, url e a imagem.
          return {
            id: detailsResponse.data.id,
            name: pokemon.name, // Mantém o nome original para consistência
            url: pokemon.url, // Mantém a URL original
            imageUrl: detailsResponse.data.sprites.front_default,
            types: detailsResponse.data.types,
            weight: detailsResponse.data.weight,
            base_experience: detailsResponse.data.base_experience,
          };
        });

        // 3. Usa Promise.all para esperar que todas as buscas de detalhes terminem.
        const detailedPokemonList = await Promise.all(pokemonDetailsPromises);

        // 4. Atualiza o estado com a lista completa de Pokémon, agora com imagens.
        setPokemonList(detailedPokemonList);
      } catch (err) {
        // Se ocorrer um erro, ele é capturado aqui.
        if (axios.isAxiosError(err)) {
          setError(`Erro ao buscar Pokémon: ${err.message}`);
        } else {
          setError('Ocorreu um erro inesperado.');
        }
        console.error(err); // Loga o erro no console para depuração.
      } finally {
        // Ao final da tentativa (com sucesso ou erro), define o loading como false.
        setLoading(false);
      }
    }

    loadPokemon();
  }, [limit]); // O array de dependências: o efeito roda novamente se 'limit' mudar.

  // O hook retorna os estados para que o componente possa usá-los.
  return { pokemonList, loading, error };
}

/**
 * Filtra uma lista de Pokémon com base em um termo de busca.
 * A busca é case-insensitive (não diferencia maiúsculas de minúsculas).
 * @param list - A lista de Pokémon a ser filtrada.
 * @param searchTerm - O termo a ser buscado no nome do Pokémon.
 * @returns Um novo array com os Pokémon que correspondem ao termo de busca.
 */
export function searchInPokemonList(list: Pokemon[], searchTerm: string): Pokemon[] {
  // Converte o termo de busca para minúsculas para uma busca case-insensitive.
  const lowerCaseSearchTerm = searchTerm.toLowerCase();

  // Usa o método 'filter' para criar um novo array apenas com os itens que passam no teste.
  return list.filter(pokemon => {
    // O teste verifica se o nome do pokémon (também em minúsculas) inclui o termo de busca.
    return pokemon.name.toLowerCase().includes(lowerCaseSearchTerm);
  });
}
