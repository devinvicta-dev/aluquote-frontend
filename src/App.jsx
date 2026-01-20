import React, { useState, useCallback, useEffect } from 'react';
import {
  Upload, FileText, Settings, Calculator, Download, 
  ChevronRight, AlertCircle, CheckCircle, Loader2,
  Layers, Box, DollarSign, Clock, Lightbulb, 
  PlusCircle, Trash2, Eye, RefreshCw, Zap,
  Building2, Hammer, Droplets, Home, DoorOpen, Wrench
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// API Configuration - uses environment variable for production backend URL
const API_BASE = import.meta.env.VITE_API_URL || '';

// ============== Category Icons ==============
const CategoryIcon = ({ category }) => {
  const icons = {
    estrutura_metalica: Building2,
    pintura_intumescente: Droplets,
    caleiros: Droplets,
    cobertura: Home,
    fachada: Layers,
    portas: DoorOpen,
    acessorios: Wrench
  };
  const Icon = icons[category] || Box;
  return <Icon className="w-5 h-5" />;
};

// ============== PDF Generation Function - FLYSTEEL Style ==============
const generatePdfDocument = (budget, projectId) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const summary = budget.summary || {};
    
    // Colors (FLYSTEEL style - professional blue/gray)
    const primaryColor = [0, 71, 133];  // Dark blue
    const accentColor = [0, 122, 194];  // Light blue
    const darkColor = [51, 51, 51];
    const grayColor = [128, 128, 128];
    const lightGray = [240, 240, 240];
    
    // ============== HEADER ==============
    // Company Logo/Name
    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.setFont(undefined, 'bold');
    doc.text('ALUQUOTE AI', 14, 20);
    
    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    doc.setFont(undefined, 'normal');
    doc.text('Metallic Structures', 14, 26);
    doc.text('Orcamentacao Inteligente', 14, 31);
    
    // Reference box (right side)
    doc.setFillColor(...lightGray);
    doc.rect(pageWidth - 75, 10, 65, 25, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...darkColor);
    doc.text('PARA:', pageWidth - 72, 17);
    doc.setFont(undefined, 'bold');
    doc.text(summary.client_name || 'Cliente', pageWidth - 72, 22);
    doc.setFont(undefined, 'normal');
    doc.text(`Ref: ${summary.project_reference || projectId}`, pageWidth - 72, 28);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-PT')}`, pageWidth - 72, 33);
    
    // Horizontal line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(14, 40, pageWidth - 14, 40);
    
    // ============== PROJECT TITLE ==============
    doc.setFontSize(14);
    doc.setTextColor(...darkColor);
    doc.setFont(undefined, 'bold');
    doc.text(`Orcamento: ${summary.project_name || 'Projeto'}`, 14, 50);
    
    // ============== BUDGET TABLE BY SECTIONS ==============
    let currentY = 60;
    const sections = summary.sections || [];
    let globalItemNum = 0;
    
    // Prepare all items for the main table
    const tableBody = [];
    
    sections.forEach((section) => {
      // Add section header row
      tableBody.push([
        { content: section.category_name || section.category, colSpan: 5, 
          styles: { fillColor: [220, 230, 241], fontStyle: 'bold', halign: 'left' }
        }
      ]);
      
      // Add items
      section.items?.forEach((item) => {
        globalItemNum++;
        tableBody.push([
          globalItemNum,
          item.description?.substring(0, 80) + (item.description?.length > 80 ? '...' : ''),
          item.quantity?.toFixed(3) || '-',
          item.unit || '-',
          (item.total_price || 0).toFixed(2)
        ]);
      });
      
      // Add section subtotal
      if (section.subtotal > 0) {
        tableBody.push([
          { content: '', colSpan: 3, styles: { fillColor: [250, 250, 250] } },
          { content: 'Subtotal:', styles: { fontStyle: 'bold', halign: 'right', fillColor: [250, 250, 250] } },
          { content: section.subtotal.toFixed(2), styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } }
        ]);
      }
    });
    
    // If no sections, use line_items directly
    if (tableBody.length === 0 && budget.line_items?.length > 0) {
      budget.line_items.forEach((item, idx) => {
        tableBody.push([
          idx + 1,
          item.description?.substring(0, 80) || '-',
          item.quantity?.toFixed(3) || '-',
          item.unit || '-',
          (item.total_price || 0).toFixed(2)
        ]);
      });
    }
    
    // Draw the main budget table
    autoTable(doc, {
      startY: currentY,
      head: [[
        { content: 'Item', styles: { halign: 'center' } },
        { content: 'Descricao dos trabalhos', styles: { halign: 'left' } },
        { content: 'Quant.', styles: { halign: 'right' } },
        { content: 'Unid.', styles: { halign: 'center' } },
        { content: 'Total EUR', styles: { halign: 'right' } }
      ]],
      body: tableBody.length > 0 ? tableBody : [['', 'Sem itens', '', '', '']],
      headStyles: { 
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 22, halign: 'right' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' }
      },
      theme: 'grid',
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer on each page
        doc.setFontSize(7);
        doc.setTextColor(...grayColor);
        doc.text('Este documento nao constitui uma apresentacao ao destinatario para conferencia de mercadorias ou prestacao de servicos.', 
          pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }
    });
    
    // ============== TOTALS SECTION ==============
    currentY = doc.lastAutoTable?.finalY + 10 || 200;
    
    // Check if we need a new page
    if (currentY > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage();
      currentY = 20;
    }
    
    const totals = summary.totals || {};
    
    // Totals box
    doc.setFillColor(...lightGray);
    doc.rect(pageWidth - 90, currentY, 76, 35, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(...darkColor);
    doc.text('Valor S/IVA:', pageWidth - 85, currentY + 10);
    doc.text(`${(totals.subtotal || 0).toFixed(2)} EUR`, pageWidth - 20, currentY + 10, { align: 'right' });
    
    doc.text(`IVA (${totals.iva_rate || 23}%):`, pageWidth - 85, currentY + 18);
    doc.text(`${(totals.iva_value || 0).toFixed(2)} EUR`, pageWidth - 20, currentY + 18, { align: 'right' });
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text('TOTAL:', pageWidth - 85, currentY + 28);
    doc.text(`${(totals.total_com_iva || totals.subtotal || 0).toFixed(2)} EUR`, pageWidth - 20, currentY + 28, { align: 'right' });
    
    // ============== TERMS & CONDITIONS ==============
    currentY += 45;
    
    if (currentY > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      currentY = 20;
    }
    
    const terms = summary.terms || {};
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...darkColor);
    
    // Terms table
    const termsBody = [
      ['Prazo da obra:', terms.prazo_obra || 'A combinar'],
      ['Condicoes de Pagamento:', terms.condicoes_pagamento || '30% na adjudicacao. Restante por autos mensais a 30 dias'],
      ['Nao inclui:', (terms.nao_inclui || []).join('. ')],
      ['Validade da proposta:', `${terms.validade_dias || 30} dias`]
    ];
    
    autoTable(doc, {
      startY: currentY,
      body: termsBody,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: 14, right: 14 }
    });
    
    // ============== FOOTER NOTE ==============
    currentY = doc.lastAutoTable?.finalY + 10 || currentY + 40;
    
    doc.setFontSize(7);
    doc.setTextColor(...grayColor);
    doc.text('Devido a instabilidade da materia prima a validade deste orcamento e de 30 dias.', 14, currentY);
    doc.text('Gerado por AluQuote AI - Orcamentacao Inteligente para Serralharia', 14, currentY + 5);
    
    // Save
    doc.save(`orcamento_${summary.project_reference || projectId || 'projeto'}.pdf`);
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Erro ao gerar PDF. Verifique a consola para detalhes.');
    return false;
  }
};

// ============== API Functions ==============
// Helper para processar respostas da API com tratamento de erros
const handleApiResponse = async (res, endpoint) => {
  if (!res.ok) {
    // Tentar ler o corpo do erro
    let errorDetail = `HTTP ${res.status}`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          errorDetail = json.detail || json.message || text;
        } catch {
          errorDetail = text.substring(0, 200);
        }
      }
    } catch {}
    throw new Error(`API ${endpoint}: ${errorDetail}`);
  }
  return res.json();
};

const api = {
  async createProject(name, description = '') {
    const res = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    return handleApiResponse(res, 'createProject');
  },

  async getProjects() {
    const res = await fetch(`${API_BASE}/api/projects`);
    return handleApiResponse(res, 'getProjects');
  },

  async getProject(id) {
    const res = await fetch(`${API_BASE}/api/projects/${id}`);
    return handleApiResponse(res, 'getProject');
  },

  async uploadFiles(projectId, files) {
    const formData = new FormData();
    formData.append('project_id', projectId);
    files.forEach(file => formData.append('files', file));
    
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      body: formData
    });
    return handleApiResponse(res, 'uploadFiles');
  },

  async calculateBudget(projectId, surfaceTreatment, parameters, materialCode = 'S275', unitMultiplier = 1, autoDetect = true) {
    const res = await fetch(`${API_BASE}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        surface_treatment: surfaceTreatment,
        parameters,
        material_code: materialCode,
        unit_multiplier: unitMultiplier,
        auto_detect_multiplier: autoDetect
      })
    });
    return handleApiResponse(res, 'calculateBudget');
  },

  async getMaterials() {
    const res = await fetch(`${API_BASE}/api/materials`);
    return handleApiResponse(res, 'getMaterials');
  },

  async getSurfaceTreatments() {
    const res = await fetch(`${API_BASE}/api/surface-treatments`);
    return handleApiResponse(res, 'getSurfaceTreatments');
  },

  async getDxfPreview(projectId) {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/dxf-preview`);
    return handleApiResponse(res, 'getDxfPreview');
  },

  async exportCsv(projectId) {
    window.open(`${API_BASE}/api/projects/${projectId}/export/csv`, '_blank');
  },

  async exportJson(projectId) {
    window.open(`${API_BASE}/api/projects/${projectId}/export/json`, '_blank');
  }
};

// ============== Icon Components ==============
const Logo = () => (
  <svg viewBox="0 0 40 40" className="w-10 h-10">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0077c2" />
        <stop offset="100%" stopColor="#00a8e8" />
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="32" height="32" rx="4" fill="url(#logoGrad)" opacity="0.2"/>
    <path d="M12 28L20 12L28 28H12Z" fill="none" stroke="url(#logoGrad)" strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="20" cy="20" r="3" fill="url(#logoGrad)"/>
    <path d="M8 32L20 8L32 32" fill="none" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

// ============== Components ==============

const FileUploadZone = ({ onFilesSelected, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    onFilesSelected(files);
  }, [onFilesSelected]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    onFilesSelected(files);
  }, [onFilesSelected]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
        ${isDragging 
          ? 'border-accent-blue bg-accent-blue/10 scale-[1.02]' 
          : 'border-industrial-600 hover:border-industrial-500 bg-industrial-800/50'}
        ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        multiple
        accept=".dxf,.pdf,.xlsx,.xls"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isProcessing}
      />
      
      <div className="flex flex-col items-center gap-4">
        {isProcessing ? (
          <Loader2 className="w-16 h-16 text-accent-blue animate-spin" />
        ) : (
          <Upload className={`w-16 h-16 ${isDragging ? 'text-accent-blue' : 'text-industrial-500'}`} />
        )}
        
        <div>
          <p className="text-lg font-medium text-industrial-200">
            {isProcessing ? 'A processar ficheiros...' : 'Arraste ficheiros para aqui'}
          </p>
          <p className="text-sm text-industrial-400 mt-1">
            Suporta ficheiros .DXF, .PDF e .XLSX (estrutura de custos FLYSTEEL)
          </p>
        </div>
        
        {!isProcessing && (
          <button className="btn-secondary mt-2">
            Selecionar Ficheiros
          </button>
        )}
      </div>
    </div>
  );
};

const FileCard = ({ file }) => {
  const isSuccess = file.status === 'processed';
  const isDxf = file.type === 'dxf';

  return (
    <div className="card flex items-center gap-4 animate-slide-up">
      <div className={`p-3 rounded-lg ${isDxf ? 'bg-accent-blue/20' : 'bg-accent-amber/20'}`}>
        {isDxf ? (
          <Layers className="w-6 h-6 text-accent-blue" />
        ) : (
          <FileText className="w-6 h-6 text-accent-amber" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-industrial-100 truncate">{file.filename}</p>
        <p className="text-sm text-industrial-400">{file.category?.replace(/_/g, ' ')}</p>
      </div>
      
      <div className="flex items-center gap-2">
        {isSuccess ? (
          <span className="badge-success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Processado
          </span>
        ) : (
          <span className="badge-error">
            <AlertCircle className="w-3 h-3 mr-1" />
            Erro
          </span>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, unit, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-accent-blue bg-accent-blue/20',
    emerald: 'text-accent-emerald bg-accent-emerald/20',
    amber: 'text-accent-amber bg-accent-amber/20',
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-industrial-400 text-sm">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="stat-value">{value}</span>
        {unit && <span className="text-industrial-400 text-sm">{unit}</span>}
      </div>
    </div>
  );
};

// Budget Section Component (grouped items by category)
const BudgetSectionCard = ({ section }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  return (
    <div className="card overflow-hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-industrial-800 hover:bg-industrial-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-blue/20">
            <CategoryIcon category={section.category} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-industrial-100">{section.category_name}</h3>
            <p className="text-sm text-industrial-400">{section.items?.length || 0} itens</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-mono font-semibold text-accent-blue">
            {section.subtotal?.toFixed(2)} EUR
          </span>
          <ChevronRight className={`w-5 h-5 text-industrial-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </button>
      
      {isExpanded && section.items?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-industrial-900">
                <th className="py-2 px-4 text-left table-header w-12">#</th>
                <th className="py-2 px-4 text-left table-header">Descricao</th>
                <th className="py-2 px-4 text-right table-header w-24">Quant.</th>
                <th className="py-2 px-4 text-center table-header w-16">Unid.</th>
                <th className="py-2 px-4 text-right table-header w-24">Preco Unit.</th>
                <th className="py-2 px-4 text-right table-header w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {section.items.map((item, idx) => (
                <tr key={idx} className="border-b border-industrial-700 hover:bg-industrial-700/30 transition-colors">
                  <td className="py-2 px-4 text-industrial-400">{item.item_number}</td>
                  <td className="py-2 px-4 text-industrial-200 text-sm">
                    <span className="line-clamp-2">{item.description}</span>
                  </td>
                  <td className="py-2 px-4 text-right font-mono">{item.quantity?.toFixed(3)}</td>
                  <td className="py-2 px-4 text-center">{item.unit}</td>
                  <td className="py-2 px-4 text-right font-mono">{item.unit_price?.toFixed(2)}</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-accent-blue">
                    {item.total_price?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Flat budget table (fallback when no sections)
const BudgetLineItemRow = ({ item }) => {
  return (
    <tr className="border-b border-industrial-700 hover:bg-industrial-700/30 transition-colors">
      <td className="py-3 px-4 table-cell">{item.item_number || item.line_id}</td>
      <td className="py-3 px-4 text-industrial-300 text-sm">
        <span className="line-clamp-2">{item.description || '-'}</span>
      </td>
      <td className="py-3 px-4 table-cell text-right font-mono">{item.quantity?.toFixed(3)}</td>
      <td className="py-3 px-4 table-cell text-center">{item.unit || '-'}</td>
      <td className="py-3 px-4 table-cell text-right font-mono">{item.unit_price?.toFixed(2)}</td>
      <td className="py-3 px-4 table-cell text-right font-semibold text-accent-blue font-mono">
        {item.total_price?.toFixed(2)}
      </td>
    </tr>
  );
};

// Material Selector Component
const MaterialSelector = ({ value, onChange, materials }) => {
  const groupedMaterials = materials?.grouped || {};
  
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-industrial-100 mb-4 flex items-center gap-2">
        <Hammer className="w-5 h-5 text-accent-blue" />
        Material Principal
      </h3>
      
      {/* Steel */}
      {groupedMaterials.steel?.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-industrial-400 mb-2">Aco</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {groupedMaterials.steel.map((mat) => (
              <button
                key={mat.code}
                onClick={() => onChange(mat.code)}
                className={`p-2 rounded-lg border text-left transition-all text-sm
                  ${value === mat.code 
                    ? 'border-accent-blue bg-accent-blue/10 text-industrial-100' 
                    : 'border-industrial-600 bg-industrial-800 text-industrial-300 hover:border-industrial-500'}`}
              >
                <p className="font-medium">{mat.code}</p>
                <p className="text-xs text-industrial-400">{mat.density_kg_m3} kg/m3</p>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Aluminum */}
      {groupedMaterials.aluminum?.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-industrial-400 mb-2">Aluminio</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {groupedMaterials.aluminum.map((mat) => (
              <button
                key={mat.code}
                onClick={() => onChange(mat.code)}
                className={`p-2 rounded-lg border text-left transition-all text-sm
                  ${value === mat.code 
                    ? 'border-accent-emerald bg-accent-emerald/10 text-industrial-100' 
                    : 'border-industrial-600 bg-industrial-800 text-industrial-300 hover:border-industrial-500'}`}
              >
                <p className="font-medium">{mat.code}</p>
                <p className="text-xs text-industrial-400">{mat.density_kg_m3} kg/m3</p>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Stainless Steel */}
      {groupedMaterials.stainless_steel?.length > 0 && (
        <div>
          <p className="text-sm text-industrial-400 mb-2">Aco Inox</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {groupedMaterials.stainless_steel.map((mat) => (
              <button
                key={mat.code}
                onClick={() => onChange(mat.code)}
                className={`p-2 rounded-lg border text-left transition-all text-sm
                  ${value === mat.code 
                    ? 'border-accent-amber bg-accent-amber/10 text-industrial-100' 
                    : 'border-industrial-600 bg-industrial-800 text-industrial-300 hover:border-industrial-500'}`}
              >
                <p className="font-medium">{mat.code}</p>
                <p className="text-xs text-industrial-400">{mat.density_kg_m3} kg/m3</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Unit Multiplier Component
const UnitMultiplierInput = ({ value, onChange, autoDetect, onAutoDetectChange }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-industrial-100 mb-4 flex items-center gap-2">
      <PlusCircle className="w-5 h-5 text-accent-blue" />
      Multiplicador de Unidades
    </h3>
    <p className="text-sm text-industrial-400 mb-4">
      Se o projeto inclui multiplas estruturas identicas (ex: 3 pavilhoes), indique a quantidade.
    </p>
    
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <label className="label">Numero de Unidades</label>
        <input
          type="number"
          min="1"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 1)}
          className="input-field w-full"
          disabled={autoDetect}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="autoDetect"
          checked={autoDetect}
          onChange={(e) => onAutoDetectChange(e.target.checked)}
          className="w-4 h-4 rounded border-industrial-600 bg-industrial-800 text-accent-blue focus:ring-accent-blue"
        />
        <label htmlFor="autoDetect" className="text-sm text-industrial-300">
          Detectar automaticamente
        </label>
      </div>
    </div>
    
    {autoDetect && (
      <p className="text-xs text-industrial-500 mt-2">
        A app ira comparar DXF com PDF para determinar o multiplicador correto.
      </p>
    )}
  </div>
);

const ParametersPanel = ({ parameters, onUpdate }) => {
  const [localParams, setLocalParams] = useState({
    lme_price_usd_kg: 2.35,
    labor_rate_eur_hr: 35,
    base_waste_factor_pct: 8,
    profit_margin_pct: 20,
    ...parameters
  });

  const handleChange = (key, value) => {
    const newParams = { ...localParams, [key]: parseFloat(value) || 0 };
    setLocalParams(newParams);
    onUpdate(newParams);
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-industrial-100 mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5 text-accent-blue" />
        Parametros de Calculo
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Preco LME (USD/kg)</label>
          <input
            type="number"
            step="0.01"
            value={localParams.lme_price_usd_kg}
            onChange={(e) => handleChange('lme_price_usd_kg', e.target.value)}
            className="input-field w-full"
          />
        </div>
        
        <div>
          <label className="label">Custo Mao-de-Obra (EUR/h)</label>
          <input
            type="number"
            step="1"
            value={localParams.labor_rate_eur_hr}
            onChange={(e) => handleChange('labor_rate_eur_hr', e.target.value)}
            className="input-field w-full"
          />
        </div>
        
        <div>
          <label className="label">Fator de Desperdicio (%)</label>
          <input
            type="number"
            step="1"
            value={localParams.base_waste_factor_pct}
            onChange={(e) => handleChange('base_waste_factor_pct', e.target.value)}
            className="input-field w-full"
          />
        </div>
        
        <div>
          <label className="label">Margem de Lucro (%)</label>
          <input
            type="number"
            step="1"
            value={localParams.profit_margin_pct}
            onChange={(e) => handleChange('profit_margin_pct', e.target.value)}
            className="input-field w-full"
          />
        </div>
      </div>
    </div>
  );
};

const SurfaceTreatmentSelector = ({ value, onChange, options }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-industrial-100 mb-4">Tratamento de Superficie</h3>
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`
            p-3 rounded-lg border text-left transition-all
            ${value === option.id 
              ? 'border-accent-blue bg-accent-blue/10 text-industrial-100' 
              : 'border-industrial-600 bg-industrial-800 text-industrial-300 hover:border-industrial-500'}
          `}
        >
          <p className="font-medium text-sm">{option.name}</p>
          <p className="text-xs mt-1 font-mono">
            {option.price_eur_m2 > 0 ? `${option.price_eur_m2} EUR/m2` : 'Sem custo'}
          </p>
        </button>
      ))}
    </div>
  </div>
);

const DXFViewer = ({ svg }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-industrial-100 mb-4 flex items-center gap-2">
      <Eye className="w-5 h-5 text-accent-blue" />
      Visualizacao DXF
    </h3>
    <div 
      className="bg-industrial-900 rounded-lg p-4 flex items-center justify-center min-h-[300px]"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  </div>
);

// Terms Editor Component
const TermsEditor = ({ terms, onUpdate }) => {
  const [localTerms, setLocalTerms] = useState({
    prazo_obra: 'A combinar',
    condicoes_pagamento: '30% na adjudicacao. Restante por autos mensais a 30 dias',
    validade_dias: 30,
    ...terms
  });

  const handleChange = (key, value) => {
    const newTerms = { ...localTerms, [key]: value };
    setLocalTerms(newTerms);
    onUpdate(newTerms);
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-industrial-100 mb-4">Termos e Condicoes</h3>
      <div className="space-y-4">
        <div>
          <label className="label">Prazo da Obra</label>
          <input
            type="text"
            value={localTerms.prazo_obra}
            onChange={(e) => handleChange('prazo_obra', e.target.value)}
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="label">Condicoes de Pagamento</label>
          <input
            type="text"
            value={localTerms.condicoes_pagamento}
            onChange={(e) => handleChange('condicoes_pagamento', e.target.value)}
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="label">Validade (dias)</label>
          <input
            type="number"
            value={localTerms.validade_dias}
            onChange={(e) => handleChange('validade_dias', parseInt(e.target.value) || 30)}
            className="input-field w-32"
          />
        </div>
      </div>
    </div>
  );
};

// ============== Main App ==============
export default function App() {
  const [currentStep, setCurrentStep] = useState('upload');
  const [project, setProject] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [budget, setBudget] = useState(null);
  const [dxfPreview, setDxfPreview] = useState(null);
  const [surfaceTreatment, setSurfaceTreatment] = useState('powder_coating_standard');
  const [parameters, setParameters] = useState({});
  const [surfaceOptions, setSurfaceOptions] = useState([]);
  const [terms, setTerms] = useState({});
  const [materialCode, setMaterialCode] = useState('S275');
  const [unitMultiplier, setUnitMultiplier] = useState(1);
  const [autoDetectMultiplier, setAutoDetectMultiplier] = useState(true);
  const [materials, setMaterials] = useState({ grouped: {} });

  // Load surface treatment options and materials
  useEffect(() => {
    api.getSurfaceTreatments()
      .then(data => setSurfaceOptions(data.options || []))
      .catch(() => {
        setSurfaceOptions([
          { id: 'none', name: 'Sem Tratamento', price_eur_m2: 0 },
          { id: 'galvanizado', name: 'Galvanizado', price_eur_m2: 0.45 },
          { id: 'powder_coating_standard', name: 'Lacagem Standard', price_eur_m2: 15 },
          { id: 'powder_coating_qualicoat', name: 'Lacagem Qualicoat', price_eur_m2: 22 },
          { id: 'powder_coating_seaside', name: 'Lacagem Seaside', price_eur_m2: 35 },
        ]);
      });
    
    api.getMaterials()
      .then(data => setMaterials(data))
      .catch(() => {
        // Fallback materials
        setMaterials({
          grouped: {
            steel: [
              { code: 'S275', name: 'Aco S275JR', density_kg_m3: 7850 },
              { code: 'S355', name: 'Aco S355JR', density_kg_m3: 7850 },
              { code: 'GALV', name: 'Aco Galvanizado', density_kg_m3: 7850 },
            ],
            aluminum: [
              { code: 'AL6060', name: 'Aluminio 6060-T6', density_kg_m3: 2700 },
              { code: 'AL6063', name: 'Aluminio 6063-T5', density_kg_m3: 2700 },
            ],
            stainless_steel: [
              { code: 'INOX304', name: 'Aco Inox 304', density_kg_m3: 7930 },
            ]
          }
        });
      });
  }, []);

  // Extrair nome do projeto a partir dos ficheiros
  const extractProjectName = (files) => {
    if (!files || files.length === 0) {
      return `Orcamento ${new Date().toLocaleDateString('pt-PT')}`;
    }
    
    // Tentar extrair nome do primeiro ficheiro
    const firstFile = files[0].name;
    
    // Remover extensão e prefixos comuns
    let name = firstFile
      .replace(/\.(xlsx?|pdf|dxf)$/i, '')
      .replace(/^(FS_|PT_|DES_|Desenho_)/i, '')
      .replace(/_/g, ' ')
      .trim();
    
    // Se o nome for muito curto ou genérico, usar data
    if (name.length < 3 || /^(lista|material|estrutura|custos)$/i.test(name)) {
      return `Orcamento ${new Date().toLocaleDateString('pt-PT')}`;
    }
    
    return name.substring(0, 50); // Limitar tamanho
  };

  const handleCreateProject = async (projectName = null) => {
    const name = projectName || `Orcamento ${new Date().toLocaleDateString('pt-PT')}`;
    
    try {
      const newProject = await api.createProject(
        name,
        'Projeto criado via AluQuote AI'
      );
      setProject(newProject);
      setBudget(null); // Limpar orçamento anterior
      return newProject;
    } catch (err) {
      console.error('Failed to create project:', err);
      // Create local project for demo
      const demoProject = {
        id: 'demo-' + Date.now(),
        name: name,
        status: 'created'
      };
      setProject(demoProject);
      setBudget(null); // Limpar orçamento anterior
      return demoProject;
    }
  };

  const handleFilesSelected = async (files) => {
    // SEMPRE criar novo projeto para novos ficheiros
    // Isso evita misturar dados de projetos diferentes
    const projectName = extractProjectName(files);
    const currentProject = await handleCreateProject(projectName);
    
    // Limpar ficheiros anteriores ao criar novo projeto
    setUploadedFiles([]);
    setIsProcessing(true);
    
    try {
      const result = await api.uploadFiles(currentProject.id, files);
      setUploadedFiles(result.results || []);
      
      // Try to get DXF preview
      if (result.results?.some(f => f.type === 'dxf')) {
        try {
          const preview = await api.getDxfPreview(project?.id || 'demo');
          setDxfPreview(preview.svg);
        } catch (e) {
          console.log('DXF preview not available');
        }
      }
      
      setCurrentStep('configure');
    } catch (err) {
      console.error('Upload failed:', err);
      // Demo mode - simulate upload
      const demoResults = files.map((file, i) => ({
        file_id: `demo-${i}`,
        filename: file.name,
        type: file.name.endsWith('.dxf') ? 'dxf' : 'pdf',
        category: file.name.endsWith('.dxf') ? 'profile_detail' : 'bill_of_materials',
        status: 'processed',
        analysis_summary: file.name.endsWith('.dxf') 
          ? { total_profiles: 5, estimated_weight_kg: 12.5 }
          : { total_items: 8, total_quantity: 24 }
      }));
      setUploadedFiles(prev => [...prev, ...demoResults]);
      setCurrentStep('configure');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCalculate = async () => {
    if (!project?.id) {
      alert('Erro: Nenhum projeto ativo. Por favor, carregue ficheiros primeiro.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const result = await api.calculateBudget(
        project.id,
        surfaceTreatment,
        parameters,
        materialCode,
        unitMultiplier,
        autoDetectMultiplier
      );
      
      if (result && result.success) {
        setBudget(result);
        setCurrentStep('results');
      } else {
        const errorMsg = result?.detail || 'Erro desconhecido ao calcular orçamento';
        alert(`Erro ao calcular: ${errorMsg}`);
        console.error('Calculation error:', result);
      }
    } catch (err) {
      console.error('Calculation failed:', err);
      alert(`Erro de comunicação com o servidor: ${err.message}\n\nVerifique se o backend está a correr.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Função removida - não usar dados demo hardcoded
  // O orçamento deve SEMPRE vir do backend com dados reais

  const handleExport = (format) => {
    const projectId = project?.id || 'demo';
    if (format === 'csv') {
      api.exportCsv(projectId);
    } else if (format === 'pdf') {
      if (budget) {
        generatePdfDocument(budget, projectId);
      } else {
        alert('Nenhum orcamento para exportar. Calcule primeiro.');
      }
    } else {
      api.exportJson(projectId);
    }
  };

  const resetProject = () => {
    setProject(null);
    setUploadedFiles([]);
    setBudget(null);
    setDxfPreview(null);
    setCurrentStep('upload');
  };

  // Get summary data
  const summary = budget?.summary || {};
  const sections = summary.sections || [];
  const totals = summary.totals || {};
  const metrics = summary.metrics || {};

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-industrial-800 border-b border-industrial-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo />
              <div>
                <h1 className="text-xl font-bold text-industrial-100">AluQuote AI</h1>
                <p className="text-xs text-industrial-400">Orcamentacao Inteligente para Serralharia</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Progress Steps */}
              <div className="hidden md:flex items-center gap-2">
                {['upload', 'configure', 'results'].map((step, i) => (
                  <React.Fragment key={step}>
                    <div className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                      ${currentStep === step 
                        ? 'bg-accent-blue/20 text-accent-blue font-medium' 
                        : 'text-industrial-400'}
                    `}>
                      <span className={`
                        w-5 h-5 rounded-full flex items-center justify-center text-xs
                        ${currentStep === step ? 'bg-accent-blue text-industrial-900' : 'bg-industrial-700'}
                      `}>
                        {i + 1}
                      </span>
                      {step === 'upload' && 'Ficheiros'}
                      {step === 'configure' && 'Configurar'}
                      {step === 'results' && 'Resultados'}
                    </div>
                    {i < 2 && <ChevronRight className="w-4 h-4 text-industrial-600" />}
                  </React.Fragment>
                ))}
              </div>
              
              {project && (
                <button onClick={resetProject} className="btn-secondary flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Novo Projeto
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload Step */}
        {currentStep === 'upload' && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-industrial-100">
                Carregue os ficheiros do projeto
              </h2>
              <p className="text-industrial-400 mt-2">
                O sistema ira analisar automaticamente desenhos DXF e documentos PDF
              </p>
            </div>
            
            <FileUploadZone 
              onFilesSelected={handleFilesSelected}
              isProcessing={isProcessing}
            />
            
            {uploadedFiles.length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="text-lg font-medium text-industrial-200">Ficheiros Carregados</h3>
                {uploadedFiles.map((file, i) => (
                  <FileCard key={file.file_id || i} file={file} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Configure Step */}
        {currentStep === 'configure' && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-industrial-100">
                  Configurar Orcamento
                </h2>
                <p className="text-industrial-400 mt-1">
                  Ajuste os parametros de calculo conforme necessario
                </p>
              </div>
              <button 
                onClick={handleCalculate}
                disabled={isProcessing}
                className="btn-primary flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
                Calcular Orcamento
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <MaterialSelector
                  value={materialCode}
                  onChange={setMaterialCode}
                  materials={materials}
                />
                
                <UnitMultiplierInput
                  value={unitMultiplier}
                  onChange={setUnitMultiplier}
                  autoDetect={autoDetectMultiplier}
                  onAutoDetectChange={setAutoDetectMultiplier}
                />
                
                <ParametersPanel 
                  parameters={parameters}
                  onUpdate={setParameters}
                />
                
                <SurfaceTreatmentSelector
                  value={surfaceTreatment}
                  onChange={setSurfaceTreatment}
                  options={surfaceOptions}
                />
                
                <TermsEditor
                  terms={terms}
                  onUpdate={setTerms}
                />
              </div>
              
              <div className="space-y-6">
                {dxfPreview && <DXFViewer svg={dxfPreview} />}
                
                {/* Files Summary */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-industrial-100 mb-4">
                    Ficheiros do Projeto
                  </h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-industrial-700 last:border-0">
                        {file.type === 'dxf' ? (
                          <Layers className="w-4 h-4 text-accent-blue" />
                        ) : (
                          <FileText className="w-4 h-4 text-accent-amber" />
                        )}
                        <span className="text-sm text-industrial-200 flex-1 truncate">
                          {file.filename}
                        </span>
                        <span className="badge-info text-xs">
                          {file.type.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Step */}
        {currentStep === 'results' && budget && (
          <div className="space-y-6 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-industrial-100">
                  Resultado do Orcamento
                </h2>
                <p className="text-industrial-400 mt-1">
                  {summary.project_name} - Ref: {summary.project_reference}
                </p>
                {summary.material && (
                  <p className="text-sm text-accent-blue mt-1">
                    Material: {summary.material.name} | Multiplicador: {summary.multiplier?.value || 1}x
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleExport('pdf')} className="btn-primary flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportar PDF
                </button>
                <button onClick={() => handleExport('csv')} className="btn-secondary flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button onClick={() => handleExport('json')} className="btn-secondary flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  JSON
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Building2}
                label="Peso Total"
                value={metrics.total_weight_kg?.toFixed(0) || 0}
                unit="kg"
                color="blue"
              />
              <StatCard
                icon={Box}
                label="Area Total"
                value={metrics.total_area_m2?.toFixed(0) || 0}
                unit="m2"
                color="emerald"
              />
              <StatCard
                icon={Layers}
                label="Comprimento"
                value={metrics.total_length_ml?.toFixed(0) || 0}
                unit="ml"
                color="amber"
              />
              <StatCard
                icon={DollarSign}
                label="Total (s/IVA)"
                value={totals.subtotal?.toFixed(2) || 0}
                unit="EUR"
                color="blue"
              />
            </div>

            {/* Budget Sections (FLYSTEEL style) */}
            {sections.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-industrial-100">
                  Itens do Orcamento por Categoria
                </h3>
                {sections.map((section, idx) => (
                  <BudgetSectionCard key={idx} section={section} />
                ))}
              </div>
            ) : (
              /* Fallback flat table */
              budget.line_items?.length > 0 && (
                <div className="card overflow-hidden">
                  <h3 className="text-lg font-semibold text-industrial-100 mb-4">
                    Itens do Orcamento
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-industrial-900">
                          <th className="py-3 px-4 text-left table-header">#</th>
                          <th className="py-3 px-4 text-left table-header">Descricao</th>
                          <th className="py-3 px-4 text-right table-header">Quant.</th>
                          <th className="py-3 px-4 text-center table-header">Unid.</th>
                          <th className="py-3 px-4 text-right table-header">Preco Unit.</th>
                          <th className="py-3 px-4 text-right table-header">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budget.line_items.map((item) => (
                          <BudgetLineItemRow key={item.item_number || item.line_id} item={item} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}

            {/* Totals Section */}
            <div className="card">
              <div className="flex justify-end">
                <div className="w-full md:w-96 space-y-3">
                  <div className="flex justify-between text-industrial-300">
                    <span>Subtotal (s/IVA):</span>
                    <span className="font-mono">{totals.subtotal?.toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between text-industrial-300">
                    <span>IVA ({totals.iva_rate || 23}%):</span>
                    <span className="font-mono">{totals.iva_value?.toFixed(2)} EUR</span>
                  </div>
                  <div className="border-t border-industrial-600 pt-3 flex justify-between">
                    <span className="text-xl font-bold text-industrial-100">TOTAL:</span>
                    <span className="text-xl font-bold text-accent-blue font-mono">
                      {totals.total_com_iva?.toFixed(2)} EUR
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-industrial-100 mb-4">
                Termos e Condicoes
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-industrial-400">Prazo da obra:</span>
                  <span className="text-industrial-200 ml-2">{summary.terms?.prazo_obra || 'A combinar'}</span>
                </div>
                <div>
                  <span className="text-industrial-400">Validade:</span>
                  <span className="text-industrial-200 ml-2">{summary.terms?.validade_dias || 30} dias</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-industrial-400">Condicoes de pagamento:</span>
                  <span className="text-industrial-200 ml-2">{summary.terms?.condicoes_pagamento}</span>
                </div>
                {summary.terms?.nao_inclui?.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-industrial-400">Nao inclui:</span>
                    <span className="text-industrial-200 ml-2">{summary.terms.nao_inclui.join('. ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-industrial-800 border-t border-industrial-700 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-industrial-400">
            <p>AluQuote AI - Powered by Matrix Agent</p>
            <p>Serralharia Civil & Metalomecanica</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
