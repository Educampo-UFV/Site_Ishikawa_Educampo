/**
 * @file tests/lib/fazendaService.spec.ts
 * @description Testes unitários para o módulo centralizado fazendaService e desambiguação defensiva.
 */

import {
  mapFarmApiToFormData,
  mapToMlRegion,
  mapToMlSystem,
  findIshikawaOptionValue,
  fetchOpcoesFormulario,
  fetchFazendaDetalhes,
} from '@/lib/fazendaService';
import { getFazendaId } from '@/types/formulario';

// Mock global do fetch
const originalFetch = global.fetch;

describe('fazendaService & Desambiguação Defensiva', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('Hierarquia Defensiva de Identificação (getFazendaId)', () => {
    it('deve priorizar o UUID (id) quando presente', () => {
      const item = { id: 'uuid-12345', email: 'teste@fazenda.com', nome: 'Fazenda Santa Tereza' };
      expect(getFazendaId(item)).toBe('uuid-12345');
    });

    it('deve priorizar o email quando o UUID estiver ausente', () => {
      const item = { email: 'teste@fazenda.com', nome: 'Fazenda Santa Tereza' };
      expect(getFazendaId(item)).toBe('teste@fazenda.com');
    });

    it('deve utilizar o nome como fallback quando id e email estiverem ausentes', () => {
      const item = { nome: 'Fazenda Santa Tereza' };
      expect(getFazendaId(item)).toBe('Fazenda Santa Tereza');
    });

    it('deve converter string simples para string idêntica (retrocompatibilidade)', () => {
      expect(getFazendaId('Fazenda Legada')).toBe('Fazenda Legada');
    });
  });

  describe('Mapeamento e Normalização (mapFarmApiToFormData)', () => {
    it('deve mapear payload completo da API preservando id e dados zootécnicos', () => {
      const apiPayload = {
        id: 'uuid-farm-1',
        nome: 'Fazenda Modelo',
        email: 'produtor@modelo.com',
        dados: {
          sistema_producao: 'compost-barn',
          total_vacas: 120,
          percentual_lactacao: 85,
          total_rebanho: 150,
          area_atividade: 30,
          numero_trabalhadores: 4,
          producao_vaca: 28.5,
          preco_recebido: 2.9,
          preco_referencia: 2.7,
          custo_concentrado: 1.85,
          ccs: 180,
          regiao_sebrae: 'sul',
        },
      };

      const result = mapFarmApiToFormData(apiPayload);

      expect(result.id_fazenda).toBe('uuid-farm-1');
      expect(result.nome_fazenda).toBe('Fazenda Modelo');
      expect(result.email).toBe('produtor@modelo.com');
      expect(result.total_vacas).toBe(120);
      expect(result.producao_vaca).toBe(28.5);
      expect(result.regiao).toBe('sul');
      expect(result.sistema_producao).toBe('compost-barn');
    });
  });

  describe('Normalização de Regiões e Sistemas para ML', () => {
    it('deve mapear variações de nomes para o enum canônico', () => {
      expect(mapToMlRegion('Sul de Minas')).toBe('sul');
      expect(mapToMlRegion('Triângulo Mineiro')).toBe('triangulo');
      expect(mapToMlSystem('compost barn - free stall')).toBe('compost-barn');
    });
  });

  describe('fetchOpcoesFormulario', () => {
    it('deve retornar opções válidas da API', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          sistemas_producao: [{ value: 'compost-barn', label: 'Compost Barn' }],
          regioes_sebrae: [{ value: 'sul', label: 'Sul' }],
          fazendas_cadastradas: [{ id: '1', nome: 'F1' }],
        }),
      } as any);

      const opcoes = await fetchOpcoesFormulario();
      expect(opcoes.sistemas_producao).toHaveLength(1);
      expect(opcoes.regioes_sebrae).toHaveLength(1);
      expect(opcoes.fazendas_cadastradas).toHaveLength(1);
    });

    it('deve lançar erro em caso de falha de rede', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Erro de conexão'));
      await expect(fetchOpcoesFormulario()).rejects.toThrow('Erro de conexão');
    });
  });

  describe('fetchFazendaDetalhes', () => {
    it('deve chamar /api/formularios com o identificador codificado na URL', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'uuid-123',
          nome: 'Fazenda Teste',
          email: 'teste@email.com',
          dados: {
            sistema_producao: 'compost-barn',
            total_vacas: 50,
            percentual_lactacao: 70,
            total_rebanho: 60,
            area_atividade: 10,
            numero_trabalhadores: 2,
            producao_vaca: 25,
            preco_recebido: 2.8,
            preco_referencia: 2.7,
            ccs: 200,
            regiao_sebrae: 'sul',
          },
        }),
      } as any);

      const farmData = await fetchFazendaDetalhes('uuid-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/formularios?nome=uuid-123')
      );
      expect(farmData.id_fazenda).toBe('uuid-123');
      expect(farmData.total_vacas).toBe(50);
    });
  });
});
