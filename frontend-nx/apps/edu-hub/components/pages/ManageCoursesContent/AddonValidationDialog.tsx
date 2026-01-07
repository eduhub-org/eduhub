import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, TextField, Chip, Alert } from '@mui/material';
import { MdClose } from 'react-icons/md';
import { Button } from '../../common/Button';
import { useTranslations } from 'next-intl';

interface AddonQuestion {
  questionId: string;
  questionType: string;
  questionText: Record<string, string>;
  extractedPrice: number;
  extractedCurrency: string;
  confidence: 'high' | 'medium' | 'low';
  warnings: Array<{ type: string; message: string; severity: string }>;
  description: string;
}

interface AddonValidationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (mappings: Array<{
    questionId: string;
    questionTextDe?: string;
    questionTextEn?: string;
    extractedPrice: number;
    validatedPrice: number;
    currency: string;
    description: string;
    confidence: string;
  }>) => Promise<void>;
  addonQuestions: AddonQuestion[];
  courseId: number;
  isLoading?: boolean;
}

export const AddonValidationDialog: React.FC<AddonValidationDialogProps> = ({
  open,
  onClose,
  onSave,
  addonQuestions,
  courseId,
  isLoading = false,
}) => {
  const t = useTranslations('manageCourse');
  const [validatedMappings, setValidatedMappings] = useState<Record<string, {
    validatedPrice: number;
    description: string;
  }>>({});

  const handlePriceChange = (questionId: string, price: number) => {
    setValidatedMappings(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        validatedPrice: price,
      },
    }));
  };

  const handleDescriptionChange = (questionId: string, description: string) => {
    setValidatedMappings(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        description,
      },
    }));
  };

  const handleSave = async () => {
    const mappings = addonQuestions.map(q => {
      const validated = validatedMappings[q.questionId];
      return {
        questionId: q.questionId,
        questionTextDe: q.questionText.de || q.questionText.default,
        questionTextEn: q.questionText.en || q.questionText.default,
        extractedPrice: q.extractedPrice,
        validatedPrice: validated?.validatedPrice ?? q.extractedPrice,
        currency: q.extractedCurrency,
        description: validated?.description ?? q.description,
        confidence: q.confidence,
      };
    });

    await onSave(mappings);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      default: return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle>
        <div className="flex justify-between items-center">
          <span>Add-ons validieren</span>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Schließen"
          >
            <MdClose className="text-xl" />
          </button>
        </div>
      </DialogTitle>

      <DialogContent sx={{ overflowY: 'auto', flex: '1 1 auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
          {addonQuestions.length === 0 ? (
            <Typography>Keine Add-ons gefunden.</Typography>
          ) : (
            addonQuestions.map((question) => {
              const validated = validatedMappings[question.questionId];
              const finalPrice = validated?.validatedPrice ?? question.extractedPrice;
              const finalDescription = validated?.description ?? question.description;

              return (
                <Box
                  key={question.questionId}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Typography variant="h6">{finalDescription}</Typography>
                    <Chip
                      label={question.confidence.toUpperCase()}
                      color={getConfidenceColor(question.confidence) as any}
                      size="small"
                    />
                  </Box>

                  {question.warnings.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {question.warnings.map((w, i) => (
                        <div key={i}>{w.message}</div>
                      ))}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Preis (in Cent)"
                      type="number"
                      value={finalPrice}
                      onChange={(e) => handlePriceChange(question.questionId, parseInt(e.target.value) || 0)}
                      fullWidth
                      size="small"
                    />

                    <TextField
                      label="Beschreibung"
                      value={finalDescription}
                      onChange={(e) => handleDescriptionChange(question.questionId, e.target.value)}
                      fullWidth
                      size="small"
                    />

                    <Typography variant="caption" color="text.secondary">
                      Frage-ID: {question.questionId}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button filled onClick={handleSave} disabled={isLoading || addonQuestions.length === 0}>
          {isLoading ? 'Speichern...' : 'Speichern & Stripe Preise erstellen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

