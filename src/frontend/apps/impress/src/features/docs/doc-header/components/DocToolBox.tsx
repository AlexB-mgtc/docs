import {
  Button,
  VariantType,
  useModal,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import {
  Box,
  DropdownMenu,
  DropdownMenuOption,
  Icon,
  IconOptions,
} from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { useEditorStore } from '@/features/docs/doc-editor/';
import {
  Doc,
  ModalRemoveDoc,
  useCopyDocLink,
} from '@/features/docs/doc-management';
import { DocShareModal } from '@/features/docs/doc-share';
import {
  KEY_LIST_DOC_VERSIONS,
  ModalSelectVersion,
} from '@/features/docs/doc-versioning';
import { useResponsiveStore } from '@/stores';

import { ModalPDF } from './ModalExport';

interface DocToolBoxProps {
  doc: Doc;
}

export const DocToolBox = ({ doc }: DocToolBoxProps) => {
  const { t } = useTranslation();
  const hasAccesses = doc.nb_accesses > 1;
  const queryClient = useQueryClient();

  const copyDocLink = useCopyDocLink(doc.id);

  const { spacingsTokens, colorsTokens } = useCunninghamTheme();

  const spacings = spacingsTokens();
  const colors = colorsTokens();

  const [isModalRemoveOpen, setIsModalRemoveOpen] = useState(false);
  const [isModalPDFOpen, setIsModalPDFOpen] = useState(false);
  const selectHistoryModal = useModal();
  const modalShare = useModal();

  const { isSmallMobile, isDesktop } = useResponsiveStore();
  const { editor } = useEditorStore();

  const { toast } = useToastProvider();
  const canViewAccesses = doc.abilities.accesses_view;

  const options: DropdownMenuOption[] = [
    ...(isSmallMobile
      ? [
          {
            label: canViewAccesses ? t('Share') : t('Copy link'),
            icon: canViewAccesses ? 'group' : 'link',

            callback: () => {
              if (canViewAccesses) {
                modalShare.open();
                return;
              }
              copyDocLink();
            },
          },
          {
            label: t('Export'),
            icon: 'download',
            callback: () => {
              setIsModalPDFOpen(true);
            },
          },
        ]
      : []),

    {
      label: t('Version history'),
      icon: 'history',
      disabled: !doc.abilities.versions_list,
      callback: () => {
        selectHistoryModal.open();
      },
      show: isDesktop,
    },

    {
      label: t('Copy as {{format}}', { format: 'Markdown' }),
      icon: 'content_copy',
      callback: () => {
        void copyCurrentEditorToClipboard('markdown');
      },
    },
    {
      label: t('Copy as {{format}}', { format: 'HTML' }),
      icon: 'content_copy',
      callback: () => {
        void copyCurrentEditorToClipboard('html');
      },
    },
    {
      label: t('Delete document'),
      icon: 'delete',
      disabled: !doc.abilities.destroy,
      callback: () => {
        setIsModalRemoveOpen(true);
      },
    },
  ];

  const copyCurrentEditorToClipboard = async (
    asFormat: 'html' | 'markdown',
  ) => {
    if (!editor) {
      toast(t('Editor unavailable'), VariantType.ERROR, { duration: 3000 });
      return;
    }

    try {
      const editorContentFormatted =
        asFormat === 'html'
          ? await editor.blocksToHTMLLossy()
          : await editor.blocksToMarkdownLossy();
      await navigator.clipboard.writeText(editorContentFormatted);
      toast(t('Copied to clipboard'), VariantType.SUCCESS, { duration: 3000 });
    } catch (error) {
      console.error(error);
      toast(t('Failed to copy to clipboard'), VariantType.ERROR, {
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    if (selectHistoryModal.isOpen) {
      return;
    }

    void queryClient.resetQueries({
      queryKey: [KEY_LIST_DOC_VERSIONS],
    });
  }, [selectHistoryModal.isOpen, queryClient]);

  return (
    <Box
      $margin={{ left: 'auto' }}
      $direction="row"
      $align="center"
      $gap="0.5rem 1.5rem"
      $wrap={isSmallMobile ? 'wrap' : 'nowrap'}
    >
      <Box
        $direction="row"
        $align="center"
        $margin={{ left: 'auto' }}
        $gap={spacings['2xs']}
      >
        {canViewAccesses && !isSmallMobile && (
          <>
            {!hasAccesses && (
              <Button
                color="tertiary-text"
                onClick={() => {
                  modalShare.open();
                }}
                size={isSmallMobile ? 'small' : 'medium'}
              >
                {t('Share')}
              </Button>
            )}
            {hasAccesses && (
              <Box
                $css={css`
                  .c__button--medium {
                    height: 32px;
                    padding: 10px var(--c--theme--spacings--xs);
                    gap: 7px;
                  }
                `}
              >
                <Button
                  color="tertiary"
                  aria-label="Share button"
                  icon={
                    <Icon iconName="group" $theme="primary" $variation="800" />
                  }
                  onClick={() => {
                    modalShare.open();
                  }}
                  size={isSmallMobile ? 'small' : 'medium'}
                >
                  {doc.nb_accesses - 1}
                </Button>
              </Box>
            )}
          </>
        )}
        {!canViewAccesses && !isSmallMobile && (
          <Button
            color="tertiary-text"
            onClick={() => {
              copyDocLink();
            }}
            size={isSmallMobile ? 'small' : 'medium'}
          >
            {t('Copy link')}
          </Button>
        )}
        {!isSmallMobile && (
          <Button
            color="tertiary-text"
            icon={
              <Icon iconName="download" $theme="primary" $variation="800" />
            }
            onClick={() => {
              setIsModalPDFOpen(true);
            }}
            size={isSmallMobile ? 'small' : 'medium'}
          />
        )}
        <DropdownMenu options={options}>
          <IconOptions
            isHorizontal
            $theme="primary"
            $padding={{ all: 'xs' }}
            $css={css`
              border-radius: 4px;
              &:hover {
                background-color: ${colors['greyscale-100']};
              }
              ${isSmallMobile
                ? css`
                    padding: 10px;
                    border: 1px solid ${colors['greyscale-300']};
                  `
                : ''}
            `}
            aria-label={t('Open the document options')}
          />
        </DropdownMenu>
      </Box>

      {modalShare.isOpen && (
        <DocShareModal onClose={() => modalShare.close()} doc={doc} />
      )}
      {isModalPDFOpen && (
        <ModalPDF onClose={() => setIsModalPDFOpen(false)} doc={doc} />
      )}
      {isModalRemoveOpen && (
        <ModalRemoveDoc onClose={() => setIsModalRemoveOpen(false)} doc={doc} />
      )}
      {selectHistoryModal.isOpen && (
        <ModalSelectVersion
          onClose={() => selectHistoryModal.close()}
          doc={doc}
        />
      )}
    </Box>
  );
};
