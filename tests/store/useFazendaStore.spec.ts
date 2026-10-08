/**
 * @fileoverview Suíte de testes unitários para o gerenciamento de estado da Fazenda (Zustand).
 * @description
 * Valida os métodos de mutação da store global. O Zustand é manipulado no ambiente Node (JSDOM)
 * simulando o que os componentes visuais fariam. Testa-se a injeção correta de dados preenchidos 
 * pelo formulário e o método de limpeza (reset) da sessão.
 */

import { useFazendaStore } from '../../src/store/useFazendaStore';

describe('Zustand Store: useFazendaStore', () => {
  const dadosMock = {
    nome_fazenda: 'Fazenda Leiteira Experimental',
    sistema_producao: 'compost-barn',
    total_vacas: 100,
    percentual_lactacao: 85,
    animais_rebanho: 120,
    area_atividade: 10.0,
    mao_obra_total: 2,
    producao_vaca: 35.0,
    preco_leite: 3.20,
    preco_referencia: 2.50,
    preco_concentrado: 2.30,
    ccs: 150,
    regiao: 'triangulo',
  };

  const mockDiagnostico = {
    resumo_geral: {
      visao_global: "Fazenda com bom potencial, mas requer ajustes.",
      prioridades: ["Reduzir CCS", "Aumentar produção por vaca"],
      proximos_passos: "Revisar rotina de ordenha."
    },
    diagrama_ishikawa: {
      ccs: { mao_de_obra: ["Falta de treinamento na ordenha"] }
    }
  };

  /**
   * @description Limpa o estado global antes de cada teste para garantir isolamento.
   * Utiliza o método `getState().limparDados()` da própria store.
   */
  beforeEach(() => {
    useFazendaStore.getState().limparDados();
  });

  /**
   * @description Verifica o estado inicial da store logo após ser instanciada.
   * O objeto de dados deve ser estritamente nulo, indicando ausência de informações de sessão.
   */
  it('deve iniciar com os dados da fazenda vazios (null)', () => {
    const estado = useFazendaStore.getState();
    expect(estado.dadosFazenda).toBeNull();
    expect(estado.diagnosticoIA).toBeNull();
  });

  /**
   * @description Simula a ação de submissão do formulário na tela de coleta.
   * Chama a função mutadora `setDadosFazenda` injetando o objeto e avalia se o estado o absorveu.
   */
  it('deve armazenar os dados da fazenda corretamente via setDadosFazenda', () => {
    useFazendaStore.getState().setDadosFazenda(dadosMock as any);
    
    const estadoAtual = useFazendaStore.getState();
    expect(estadoAtual.dadosFazenda).toEqual(dadosMock);
    expect(estadoAtual.dadosFazenda?.nome_fazenda).toBe('Fazenda Leiteira Experimental');
  });

  /**
   * @description Simula o armazenamento da resposta do BFF.
   */
  it('deve armazenar os dados do diagnóstico corretamente via setDiagnosticoIA', () => {
    useFazendaStore.getState().setDiagnosticoIA(mockDiagnostico as any);
    
    const estadoAtual = useFazendaStore.getState();
    expect(estadoAtual.diagnosticoIA).toEqual(mockDiagnostico);
  });

  /**
   * @description Avalia a mecânica de prevenção de vazamento de estado.
   * Primeiro injeta dados, depois aciona a limpeza e verifica se a referência volta a ser null.
   */
  it('deve resetar o estado quando limparDados for chamado', () => {
    const store = useFazendaStore.getState();
    
    store.setDadosFazenda(dadosMock as any);
    store.setDiagnosticoIA(mockDiagnostico as any);
    expect(useFazendaStore.getState().dadosFazenda).not.toBeNull();
    expect(useFazendaStore.getState().diagnosticoIA).not.toBeNull();
    
    store.limparDados();
    expect(useFazendaStore.getState().dadosFazenda).toBeNull();
    expect(useFazendaStore.getState().diagnosticoIA).toBeNull();
  });

  describe('Persistência dos Sliders de Simulação (valoresSimulacao)', () => {
    const mockValoresSimulacao = {
      total_vacas: 140,
      percentual_lactacao: 88,
      producao_vaca: 32.5,
      preco_recebido: 3.50,
      area_atividade: 12.0,
      ccs: 180,
      numero_trabalhadores: 3,
      custo_concentrado: 2.15,
    };

    it('deve iniciar com valoresSimulacao nulo (null)', () => {
      const estado = useFazendaStore.getState();
      expect(estado.valoresSimulacao).toBeNull();
    });

    it('deve armazenar os valores da simulação via setValoresSimulacao', () => {
      useFazendaStore.getState().setValoresSimulacao(mockValoresSimulacao);

      const estadoAtual = useFazendaStore.getState();
      expect(estadoAtual.valoresSimulacao).toEqual(mockValoresSimulacao);
      expect(estadoAtual.valoresSimulacao?.total_vacas).toBe(140);
    });

    it('deve garantir isolamento entre dadosFazenda e valoresSimulacao', () => {
      useFazendaStore.getState().setDadosFazenda(dadosMock as any);
      useFazendaStore.getState().setValoresSimulacao(mockValoresSimulacao);

      const estadoAtual = useFazendaStore.getState();
      expect(estadoAtual.dadosFazenda?.total_vacas).toBe(100);
      expect(estadoAtual.valoresSimulacao?.total_vacas).toBe(140);
    });

    it('deve resetar valoresSimulacao para null quando limparDados for chamado', () => {
      useFazendaStore.getState().setValoresSimulacao(mockValoresSimulacao);
      expect(useFazendaStore.getState().valoresSimulacao).not.toBeNull();

      useFazendaStore.getState().limparDados();
      expect(useFazendaStore.getState().valoresSimulacao).toBeNull();
    });
  });
});