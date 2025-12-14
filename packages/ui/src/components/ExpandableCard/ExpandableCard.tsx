'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useOutsideClick } from './use-outside-click';
import { CloseIcon } from './CloseIcon';
import type { ExpandableCardItem, ExpandableCardProps } from './ExpandableCard.types';
import { cn } from '../../utils';

/**
 * Expandable Card Component
 * 
 * Displays a list of cards that expand into a modal with detailed content.
 * Uses Framer Motion for smooth animations and layout transitions.
 * 
 * @param props - Component configuration
 * @param props.cards - Array of card items to display
 * @param props.className - Optional className for container
 * @param props.onCtaClick - Callback when CTA button is clicked
 * @returns Expandable card component
 */
export function ExpandableCard({
  cards,
  className,
  onCtaClick,
}: ExpandableCardProps) {
  const [active, setActive] = useState<ExpandableCardItem | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    /**
     * Handle Escape key to close modal
     */
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActive(null);
      }
    }

    // Prevent body scroll when modal is open
    if (active) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  const handleCtaClick = (card: ExpandableCardItem) => {
    if (onCtaClick) {
      onCtaClick(card);
    } else if (card.ctaLink) {
      window.open(card.ctaLink, '_blank');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
          />
        )}
      </AnimatePresence>

      {/* Expanded Modal */}
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 grid place-items-center z-[100]">
            {/* Close button for mobile */}
            <motion.button
              key={`button-${active.id}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: { duration: 0.05 },
              }}
              className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-white dark:bg-neutral-900 rounded-full h-8 w-8 shadow-lg"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>

            {/* Expanded Card */}
            <motion.div
              layoutId={`card-${active.id}-${id}`}
              ref={ref}
              className="w-full max-w-[500px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Image */}
              <motion.div layoutId={`image-${active.id}-${id}`}>
                <img
                  width={200}
                  height={200}
                  src={active.src}
                  alt={active.title}
                  className="w-full h-80 lg:h-80 sm:rounded-tr-lg sm:rounded-tl-lg object-cover object-top"
                />
              </motion.div>

              {/* Content */}
              <div>
                <div className="flex justify-between items-start p-4">
                  <div>
                    <motion.h3
                      layoutId={`title-${active.id}-${id}`}
                      className="font-bold text-neutral-700 dark:text-neutral-200 text-lg"
                    >
                      {active.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active.id}-${id}`}
                      className="text-neutral-600 dark:text-neutral-400 text-sm mt-1"
                    >
                      {active.description}
                    </motion.p>
                  </div>

                  <motion.button
                    layoutId={`button-${active.id}-${id}`}
                    onClick={() => handleCtaClick(active)}
                    className="px-4 py-3 text-sm rounded-full font-bold bg-green-500 hover:bg-green-600 text-white transition-colors"
                  >
                    {active.ctaText}
                  </motion.button>
                </div>

                {/* Detailed Content */}
                <div className="pt-4 relative px-4">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-neutral-600 text-xs md:text-sm lg:text-base h-40 md:h-fit pb-10 flex flex-col items-start gap-4 overflow-auto dark:text-neutral-400 [mask:linear-gradient(to_bottom,white,white,transparent)] [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]"
                  >
                    {typeof active.content === 'function'
                      ? active.content()
                      : active.content}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Card List */}
      <ul className={cn('max-w-2xl mx-auto w-full gap-4', className)}>
        {cards.map((card) => (
          <motion.div
            layoutId={`card-${card.id}-${id}`}
            key={`card-${card.id}-${id}`}
            onClick={() => setActive(card)}
            className="p-4 flex flex-col md:flex-row justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl cursor-pointer transition-colors"
          >
            <div className="flex gap-4 flex-col md:flex-row w-full">
              <motion.div layoutId={`image-${card.id}-${id}`}>
                <img
                  width={100}
                  height={100}
                  src={card.src}
                  alt={card.title}
                  className="h-40 w-40 md:h-14 md:w-14 rounded-lg object-cover object-top"
                />
              </motion.div>
              <div className="flex-1">
                <motion.h3
                  layoutId={`title-${card.id}-${id}`}
                  className="font-medium text-neutral-800 dark:text-neutral-200 text-center md:text-left"
                >
                  {card.title}
                </motion.h3>
                <motion.p
                  layoutId={`description-${card.id}-${id}`}
                  className="text-neutral-600 dark:text-neutral-400 text-center md:text-left text-sm"
                >
                  {card.description}
                </motion.p>
                {card.price && (
                  <p className="text-green-500 font-bold text-lg mt-1 text-center md:text-left">
                    {card.price} USDC
                  </p>
                )}
              </div>
            </div>
            <motion.button
              layoutId={`button-${card.id}-${id}`}
              className="px-4 py-2 text-sm rounded-full font-bold bg-gray-100 hover:bg-green-500 hover:text-white text-black mt-4 md:mt-0 transition-colors"
            >
              {card.ctaText}
            </motion.button>
          </motion.div>
        ))}
      </ul>
    </>
  );
}

