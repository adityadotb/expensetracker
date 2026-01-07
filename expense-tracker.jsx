import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [entryType, setEntryType] = useState('expense');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load expenses from storage
    const loadExpenses = async () => {
      try {
        const keys = await window.storage.list('expense:');
        if (keys && keys.keys) {
          const loadedExpenses = await Promise.all(
            keys.keys.map(async (key) => {
              const result = await window.storage.get(key);
              return result ? JSON.parse(result.value) : null;
            })
          );
          setExpenses(loadedExpenses.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp));
        }
      } catch (error) {
        console.log('Starting fresh - no saved expenses');
      }
    };
    
    // Load income from storage
    const loadIncome = async () => {
      try {
        const keys = await window.storage.list('income:');
        if (keys && keys.keys) {
          const loadedIncome = await Promise.all(
            keys.keys.map(async (key) => {
              const result = await window.storage.get(key);
              return result ? JSON.parse(result.value) : null;
            })
          );
          setIncome(loadedIncome.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp));
        }
      } catch (error) {
        console.log('Starting fresh - no saved income');
      }
    };
    
    loadExpenses();
    loadIncome();
  }, []);

  const addEntry = async () => {
    if (description.trim() && amount && parseFloat(amount) > 0) {
      const newEntry = {
        id: Date.now().toString(),
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        timestamp: Date.now(),
        date: new Date().toLocaleDateString()
      };
      
      try {
        if (entryType === 'expense') {
          await window.storage.set(`expense:${newEntry.id}`, JSON.stringify(newEntry));
          setExpenses([newEntry, ...expenses]);
        } else {
          await window.storage.set(`income:${newEntry.id}`, JSON.stringify(newEntry));
          setIncome([newEntry, ...income]);
        }
        setDescription('');
        setAmount('');
      } catch (error) {
        console.error('Failed to save entry:', error);
        if (entryType === 'expense') {
          setExpenses([newEntry, ...expenses]);
        } else {
          setIncome([newEntry, ...income]);
        }
        setDescription('');
        setAmount('');
      }
    }
  };

  const deleteExpense = async (id) => {
    try {
      await window.storage.delete(`expense:${id}`);
    } catch (error) {
      console.log('Storage delete failed, continuing anyway');
    }
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  const deleteIncome = async (id) => {
    try {
      await window.storage.delete(`income:${id}`);
    } catch (error) {
      console.log('Storage delete failed, continuing anyway');
    }
    setIncome(income.filter(inc => inc.id !== id));
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
  const balance = totalIncome - totalExpenses;
  
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafafa',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '3rem 1.5rem',
    }}>
      <div style={{
        maxWidth: '680px',
        margin: '0 auto',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.6s ease'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '4rem',
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: '#111',
            marginBottom: '1rem',
            letterSpacing: '-0.02em'
          }}>
            Expenses
          </h1>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem'
          }}>
            <div>
              <div style={{
                fontSize: '0.8125rem',
                color: '#999',
                marginBottom: '0.25rem'
              }}>
                Total Income
              </div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '300',
                color: '#22c55e',
                letterSpacing: '-0.03em'
              }}>
                ${totalIncome.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '0.8125rem',
                color: '#999',
                marginBottom: '0.25rem'
              }}>
                Total Expenses
              </div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '300',
                color: '#ef4444',
                letterSpacing: '-0.03em'
              }}>
                ${totalExpenses.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '0.8125rem',
                color: '#999',
                marginBottom: '0.25rem'
              }}>
                Balance
              </div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '300',
                color: balance >= 0 ? '#22c55e' : '#ef4444',
                letterSpacing: '-0.03em'
              }}>
                ${balance.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Income vs Expenses Comparison Graph */}
        <div style={{
          marginBottom: '3rem',
          padding: '1.5rem',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e5e5e5'
        }}>
          <div style={{
            fontSize: '0.8125rem',
            fontWeight: '500',
            color: '#999',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1.5rem'
          }}>
            Income vs Expenses
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', height: '200px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{
                background: '#22c55e',
                height: `${totalIncome > 0 ? Math.min((totalIncome / Math.max(totalIncome, totalExpenses)) * 100, 100) : 0}%`,
                minHeight: totalIncome > 0 ? '40px' : '0',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.6s ease',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '0.75rem'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#fff'
                }}>
                  ${totalIncome.toFixed(0)}
                </div>
              </div>
              <div style={{
                textAlign: 'center',
                marginTop: '0.75rem',
                fontSize: '0.875rem',
                color: '#666',
                fontWeight: '500'
              }}>
                Income
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{
                background: '#ef4444',
                height: `${totalExpenses > 0 ? Math.min((totalExpenses / Math.max(totalIncome, totalExpenses)) * 100, 100) : 0}%`,
                minHeight: totalExpenses > 0 ? '40px' : '0',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.6s ease',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '0.75rem'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#fff'
                }}>
                  ${totalExpenses.toFixed(0)}
                </div>
              </div>
              <div style={{
                textAlign: 'center',
                marginTop: '0.75rem',
                fontSize: '0.875rem',
                color: '#666',
                fontWeight: '500'
              }}>
                Expenses
              </div>
            </div>
          </div>
        </div>

        {/* Add Expense Form */}
        <div style={{
          marginBottom: '3rem',
          padding: '1.5rem',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e5e5e5'
        }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <button
              onClick={() => setEntryType('expense')}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                background: entryType === 'expense' ? '#111' : '#f5f5f5',
                color: entryType === 'expense' ? '#fff' : '#666',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Expense
            </button>
            <button
              onClick={() => setEntryType('income')}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                background: entryType === 'income' ? '#111' : '#f5f5f5',
                color: entryType === 'income' ? '#fff' : '#666',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Income
            </button>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}>
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addEntry()}
              style={{
                padding: '0.75rem',
                border: '1px solid #e5e5e5',
                borderRadius: '4px',
                background: '#fff',
                color: '#111',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#111'}
              onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
            />
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: entryType === 'expense' ? '1fr 1fr' : '1fr',
              gap: '0.75rem'
            }}>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addEntry()}
                step="0.01"
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '4px',
                  background: '#fff',
                  color: '#111',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#111'}
                onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
              />
              
              {entryType === 'expense' && (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #e5e5e5',
                    borderRadius: '4px',
                    background: '#fff',
                    color: '#111',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#111'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>
            
            <button
              onClick={addEntry}
              style={{
                padding: '0.75rem',
                border: 'none',
                borderRadius: '4px',
                background: '#111',
                color: '#fff',
                fontSize: '0.9375rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#333'}
              onMouseLeave={(e) => e.target.style.background = '#111'}
            >
              Add {entryType === 'expense' ? 'Expense' : 'Income'}
            </button>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(categoryTotals).length > 0 && (
          <div style={{
            marginBottom: '3rem'
          }}>
            <div style={{
              fontSize: '0.8125rem',
              fontWeight: '500',
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1.5rem'
            }}>
              Expenses by Category
            </div>
            <div style={{
              padding: '1.5rem',
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #e5e5e5'
            }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '1.25rem'
              }}>
                {Object.entries(categoryTotals)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, total]) => {
                    const percentage = (total / totalExpenses) * 100;
                    return (
                      <div key={cat}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{
                            fontSize: '0.9375rem',
                            color: '#666',
                            fontWeight: '500'
                          }}>
                            {cat}
                          </div>
                          <div style={{
                            fontSize: '0.9375rem',
                            fontWeight: '600',
                            color: '#111'
                          }}>
                            ${total.toFixed(2)}
                          </div>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          background: '#f5f5f5',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: '#111',
                            borderRadius: '4px',
                            transition: 'width 0.6s ease'
                          }} />
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#999',
                          marginTop: '0.25rem'
                        }}>
                          {percentage.toFixed(1)}% of total
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div>
          <div style={{
            fontSize: '0.8125rem',
            fontWeight: '500',
            color: '#999',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1.5rem'
          }}>
            Recent Transactions
          </div>
          
          {expenses.length === 0 && income.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#999',
              fontSize: '0.9375rem'
            }}>
              No transactions yet
            </div>
          ) : (
            <>
              {/* Income Entries */}
              {income.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#22c55e',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '1rem'
                  }}>
                    Income
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {income.map((item, index) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem 0',
                          borderBottom: '1px solid #f0f0f0',
                          opacity: 0,
                          animation: `fadeIn 0.4s ease forwards ${index * 0.03}s`
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '0.9375rem',
                            color: '#111',
                            marginBottom: '0.25rem'
                          }}>
                            {item.description}
                          </div>
                          <div style={{
                            fontSize: '0.8125rem',
                            color: '#999'
                          }}>
                            {item.date}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem'
                        }}>
                          <div style={{
                            fontSize: '0.9375rem',
                            fontWeight: '600',
                            color: '#22c55e',
                            textAlign: 'right',
                            minWidth: '80px'
                          }}>
                            +${item.amount.toFixed(2)}
                          </div>
                          <button
                            onClick={() => deleteIncome(item.id)}
                            style={{
                              padding: '0.375rem',
                              border: 'none',
                              background: 'transparent',
                              color: '#ccc',
                              cursor: 'pointer',
                              transition: 'color 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#999'}
                            onMouseLeave={(e) => e.target.style.color = '#ccc'}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expense Entries */}
              {expenses.length > 0 && (
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#ef4444',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '1rem'
                  }}>
                    Expenses
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {expenses.map((expense, index) => (
                      <div
                        key={expense.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem 0',
                          borderBottom: '1px solid #f0f0f0',
                          opacity: 0,
                          animation: `fadeIn 0.4s ease forwards ${index * 0.03}s`
                        }}
                      >
                        <style>
                          {`
                            @keyframes fadeIn {
                              from {
                                opacity: 0;
                                transform: translateY(4px);
                              }
                              to {
                                opacity: 1;
                                transform: translateY(0);
                              }
                            }
                          `}
                        </style>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '0.9375rem',
                            color: '#111',
                            marginBottom: '0.25rem'
                          }}>
                            {expense.description}
                          </div>
                          <div style={{
                            fontSize: '0.8125rem',
                            color: '#999'
                          }}>
                            {expense.category} · {expense.date}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem'
                        }}>
                          <div style={{
                            fontSize: '0.9375rem',
                            fontWeight: '600',
                            color: '#ef4444',
                            textAlign: 'right',
                            minWidth: '80px'
                          }}>
                            -${expense.amount.toFixed(2)}
                          </div>
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            style={{
                              padding: '0.375rem',
                              border: 'none',
                              background: 'transparent',
                              color: '#ccc',
                              cursor: 'pointer',
                              transition: 'color 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#999'}
                            onMouseLeave={(e) => e.target.style.color = '#ccc'}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Font import */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
    </div>
  );
}