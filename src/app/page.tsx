'use client';

// Exemplo em um arquivo de página: /pages/pokedex.tsx
import { useState, useMemo, useCallback } from "react";
import { usePokemonList, searchInPokemonList, Pokemon } from "../api/hooks";

export default function PokedexPage() {
  // 1. Consumindo o hook para buscar a lista de Pokémon
  const { pokemonList, loading, error } = usePokemonList(151); // Busca os 151 primeiros

  // 2. Estados para o campo de busca e para o Pokémon selecionado no modal
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 3. Filtrando a lista de Pokémon com base no termo de busca
  // useMemo otimiza o desempenho, refazendo o filtro apenas se a lista ou o termo mudarem.
  const filteredList = useMemo(() => {
    if (!searchTerm) {
      return pokemonList; // Se não houver busca, retorna a lista completa
    }
    return searchInPokemonList(pokemonList, searchTerm);
  }, [pokemonList, searchTerm]);

  const selectedPokemon = selectedIndex !== null ? filteredList[selectedIndex] : null;

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((prevIndex) => {
        if (prevIndex === null) return null;
        return (prevIndex + 1) % filteredList.length;
    });
  }, [selectedIndex, filteredList.length]);

  const handlePrevious = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((prevIndex) => {
        if (prevIndex === null) return null;
        return (prevIndex - 1 + filteredList.length) % filteredList.length;
    });
  }, [selectedIndex, filteredList.length]);

  // 4. Renderizando a UI com base nos estados
  if (loading) {
    return <div>Carregando Pokédex...</div>;
  }

  if (error) {
    return <div>Ocorreu um erro: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Pokédex</h1>
      <input
        type="text"
        placeholder="Buscar Pokémon..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="block w-full max-w-md mx-auto mb-8 p-2 border text-black border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
      />

      {filteredList.length > 0 ? (
        <div className="flex flex-wrap gap-4 justify-center">
          {filteredList.map((pokemon, index) => (
            <div
              key={pokemon.name} 
              onClick={() => setSelectedIndex(index)}
              className="bg-white border border-gray-200 rounded-lg p-4 text-center shadow-md cursor-pointer transition-transform duration-200 ease-in-out hover:scale-105 hover:shadow-lg"
            >
              <img src={pokemon.imageUrl} alt={`Imagem do ${pokemon.name}`} className="w-24 h-24 mx-auto" />
              <p className="capitalize mt-2 font-bold text-gray-700">{pokemon.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">Nenhum Pokémon encontrado com o termo "{searchTerm}".</p>
      )}

      {selectedPokemon && (
        <PokemonModal 
          pokemon={selectedPokemon} 
          onClose={() => setSelectedIndex(null)}
          onNext={handleNext}
          onPrevious={handlePrevious}
          showNavigation={filteredList.length > 1} />
      )}
    </div>
  );
}

/**
 * Componente para o Modal que exibe os detalhes de um Pokémon.
 */
function PokemonModal({ pokemon, onClose, onNext, onPrevious, showNavigation }: { 
  pokemon: Pokemon; 
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  showNavigation: boolean;
}) {
  // Converte o peso de hectogramas para quilogramas
  const weightInKg = pokemon.weight / 10;

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50" 
      onClick={onClose} // Fecha o modal ao clicar no fundo
    >
      {showNavigation && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrevious(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
          aria-label="Pokémon anterior"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
      )}

      <div 
        className="bg-white p-6 sm:p-8 rounded-lg shadow-xl relative text-center w-11/12 max-w-sm" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="absolute top-2 right-2 bg-transparent border-none text-2xl cursor-pointer text-gray-500 hover:text-gray-800" 
          onClick={onClose}
        >&times;</button>
        
        <h2 className="capitalize text-2xl font-bold mt-0 mb-4 text-gray-800">{pokemon.name}</h2>
        <img src={pokemon.imageUrl} alt={`Imagem do ${pokemon.name}`} className="w-32 h-32 mx-auto" />
        
        <p className="my-2 text-gray-700"><strong>ID:</strong> #{pokemon.id}</p>
        <p className="my-2 text-gray-700"><strong>Tipo(s):</strong> {pokemon.types.map(t => <span key={t.type.name} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2 capitalize">{t.type.name}</span>)}</p>
        <p className="my-2 text-gray-700"><strong>Peso:</strong> {weightInKg.toFixed(1)} kg</p>
        <p className="my-2 text-gray-700"><strong>Experiência Base:</strong> {pokemon.base_experience}</p>
      </div>

      {showNavigation && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
          aria-label="Próximo Pokémon"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      )}
    </div>
  );
}
