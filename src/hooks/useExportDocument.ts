import { useState } from 'react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TableRow, TableCell, Table, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface CalculoContrato {
  valorTotal: number;
  jurosTotal: number;
  valorCorrigido: number;
  diferenca: number;
  detalhamento: string;
}

interface CalculoPensao {
  valorPensao: number;
  percentualRenda: number;
  valorTotalAtrasado: number;
  multa: number;
  juros: number;
  valorCorrigido: number;
  detalhamento: string;
}

export const useExportDocument = () => {
  const [loading, setLoading] = useState(false);

  const exportCalculoContrato = async (calculo: CalculoContrato, formData: any) => {
    setLoading(true);
    try {
      const doc = new Document({
        sections: [{
          children: [
            // Cabeçalho
            new Paragraph({
              children: [
                new TextRun({
                  text: "RELATÓRIO DE CÁLCULO DE CONTRATO BANCÁRIO",
                  bold: true,
                  size: 28,
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Oráculo Jurídico - Calculadora Especializada",
                  italics: true,
                  size: 20,
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 }
            }),

            // Dados do contrato
            new Paragraph({
              children: [
                new TextRun({
                  text: "DADOS DO CONTRATO",
                  bold: true,
                  size: 24,
                })
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 }
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Valor do Contrato:", bold: true })] })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: `R$ ${parseFloat(formData.valorContrato).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` })] })]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Data do Contrato:", bold: true })] })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: new Date(formData.dataContrato).toLocaleDateString('pt-BR') })] })]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Data de Vencimento:", bold: true })] })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: new Date(formData.dataVencimento).toLocaleDateString('pt-BR') })] })]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Taxa de Juros:", bold: true })] })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: `${formData.taxaJuros}% a.m.` })] })]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Tipo de Juros:", bold: true })] })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: formData.tipoJuros === 'simples' ? 'Juros Simples' : 'Juros Compostos' })] })]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Índice de Correção:", bold: true })] })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: formData.indiceCorrecao.toUpperCase() })] })]
                    })
                  ]
                })
              ]
            }),

            // Resultados
            new Paragraph({
              children: [
                new TextRun({
                  text: "RESULTADOS DO CÁLCULO",
                  bold: true,
                  size: 24,
                })
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 600, after: 200 }
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Valor Total Devido:", bold: true })] })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: `R$ ${calculo.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, bold: true, color: "00AA00" })] })]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Valor Corrigido:", bold: true })] })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: `R$ ${calculo.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` })] })]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Juros Totais:", bold: true })] })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: `R$ ${calculo.jurosTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` })] })]
                    })
                  ]
                })
              ]
            }),

            // Detalhamento completo
            new Paragraph({
              children: [
                new TextRun({
                  text: "DETALHAMENTO COMPLETO",
                  bold: true,
                  size: 24,
                })
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 600, after: 200 }
            }),

            // Converter o detalhamento em parágrafos
            ...calculo.detalhamento.split('\n').map(line => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    font: "Courier New",
                    size: 18
                  })
                ],
                spacing: { after: 100 }
              })
            )
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `calculo-contrato-bancario-${new Date().toISOString().split('T')[0]}.docx`;
      saveAs(blob, fileName);
      
      toast.success(`Documento exportado como ${fileName}`);
    } catch (error) {
      console.error('Erro ao exportar documento:', error);
      toast.error('Erro ao exportar documento');
    } finally {
      setLoading(false);
    }
  };

  const exportCalculoPensao = async (calculo: CalculoPensao, formData: any) => {
    setLoading(true);
    try {
      const doc = new Document({
        sections: [{
          children: [
            // Cabeçalho
            new Paragraph({
              children: [
                new TextRun({
                  text: "RELATÓRIO DE CÁLCULO DE PENSÃO ALIMENTÍCIA",
                  bold: true,
                  size: 28,
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Oráculo Jurídico - Calculadora Especializada",
                  italics: true,
                  size: 20,
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 }
            }),

            // Dados da pensão
            new Paragraph({
              children: [
                new TextRun({
                  text: "DADOS DA PENSÃO ALIMENTÍCIA",
                  bold: true,
                  size: 24,
                })
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 }
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Tipo de Cálculo:", bold: true })] })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: formData.tipoCalculo === 'percentual' ? 'Percentual da Renda' : 'Valor Fixo' })] })]
                    })
                  ]
                }),
                ...(formData.tipoCalculo === 'percentual' ? [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Renda do Alimentante:", bold: true })] })]
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: `R$ ${parseFloat(formData.rendaAlimentante || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` })] })]
                      })
                    ]
                  })
                ] : [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Valor Fixo:", bold: true })] })]
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: `R$ ${parseFloat(formData.valorFixo || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` })] })]
                      })
                    ]
                  })
                ]),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Número de Filhos:", bold: true })] })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: formData.numeroFilhos })] })]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Data de Início:", bold: true })] })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: new Date(formData.dataInicio).toLocaleDateString('pt-BR') })] })]
                    })
                  ]
                })
              ]
            }),

            // Resultados
            new Paragraph({
              children: [
                new TextRun({
                  text: "RESULTADOS DO CÁLCULO",
                  bold: true,
                  size: 24,
                })
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 600, after: 200 }
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Valor da Pensão Mensal:", bold: true })] })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: `R$ ${calculo.valorPensao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, bold: true, color: "0066CC" })] })]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Valor Total Corrigido:", bold: true })] })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: `R$ ${calculo.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, bold: true, color: "00AA00" })] })]
                    })
                  ]
                }),
                ...(calculo.valorTotalAtrasado > 0 ? [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Valor em Atraso:", bold: true })] })]
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: `R$ ${calculo.valorTotalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` })] })]
                      })
                    ]
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Multa e Juros:", bold: true })] })]
                      }),
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: `R$ ${(calculo.multa + calculo.juros).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` })] })]
                      })
                    ]
                  })
                ] : [])
              ]
            }),

            // Detalhamento completo
            new Paragraph({
              children: [
                new TextRun({
                  text: "DETALHAMENTO COMPLETO",
                  bold: true,
                  size: 24,
                })
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 600, after: 200 }
            }),

            // Converter o detalhamento em parágrafos
            ...calculo.detalhamento.split('\n').map(line => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    font: "Courier New",
                    size: 18
                  })
                ],
                spacing: { after: 100 }
              })
            )
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `calculo-pensao-alimenticia-${new Date().toISOString().split('T')[0]}.docx`;
      saveAs(blob, fileName);
      
      toast.success(`Documento exportado como ${fileName}`);
    } catch (error) {
      console.error('Erro ao exportar documento:', error);
      toast.error('Erro ao exportar documento');
    } finally {
      setLoading(false);
    }
  };

  return {
    exportCalculoContrato,
    exportCalculoPensao,
    loading
  };
};