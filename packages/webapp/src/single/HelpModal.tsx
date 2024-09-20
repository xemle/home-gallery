import React, { useEffect, useRef, FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as icons from '@fortawesome/free-solid-svg-icons';

interface HelperModalsProps {
    showHelp: boolean;
    setShowHelp: (show: boolean) => void;
    dispatch: (action: { type: string }) => void;
}

const ShortcutItem: FC<{ label: string, keys: string[] }> = ({ label, keys }) => (
    <div className="w-full flex justify-between items-center">
        <div className="text-sm">{label}</div>
        <div className="flex space-x-1 text-xs">
            {keys.map((key, index) => (
                <div key={index} className="h-fit py-1 px-2 flex items-center justify-center rounded border border-black/10 capitalize text-gray-600 dark:border-white/10 dark:text-gray-300">
                    {key}
                </div>
            ))}
        </div>
    </div>
);

export const HelpModal: FC<HelperModalsProps> = ({ showHelp, setShowHelp, dispatch }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    const handleToggleModal = () => {
        setShowHelp(!showHelp);
        dispatch({ type: 'help' });
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
            setShowHelp(false);
        }
    };

    useEffect(() => {
        if (showHelp) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showHelp]);

    return (
        <>
            <div className="hidden lg:flex fixed bottom-0 right-0 px-2 py-2 z-20">
                <a
                    className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 hover:cursor-pointer"
                    onClick={handleToggleModal}
                    title="Help"
                >
                    <FontAwesomeIcon
                        icon={icons.faQuestion}
                        className="text-gray-700 hover:text-gray-400 active:text-gray-200"
                    />
                </a>
            </div>
            {showHelp && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="modal fixed top-0 right-0 left-0 bottom-0 bg-black/60 w-full h-screen max-h-[100dvh] flex justify-center z-[9999] overflow-hidden overscroll-contain">
                        <div
                            ref={modalRef}
                            className="m-auto rounded-2xl max-w-full w-[48rem] mx-2 bg-gray-50 dark:bg-gray-900 shadow-3xl max-h-[100dvh] overflow-y-auto scrollbar-hidden"
                        >
                            <div className="text-gray-700 dark:text-gray-100">
                                <div className="flex justify-between dark:text-gray-300 px-5 pt-4">
                                    <div className="text-lg font-medium self-center">
                                        Keyboard shortcuts
                                    </div>
                                    <button
                                        className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 hover:cursor-pointer"
                                        onClick={() => setShowHelp(false)}
                                    >
                                        <FontAwesomeIcon
                                            icon={icons.faXmark}
                                            className="text-gray-700 hover:text-gray-400 active:text-gray-200"
                                        />
                                    </button>
                                </div>
                                <div className="flex flex-col md:flex-row w-full p-5 md:space-x-4 dark:text-gray-200">
                                    <div className="flex flex-col w-full sm:flex-row sm:justify-center sm:space-x-6">
                                        <div className="flex flex-col space-y-3 w-full self-start">
                                            <ShortcutItem label="Next" keys={['Right', '/', 'k', '/', 'Space']} />
                                            <ShortcutItem label="Prev" keys={['Left', '/', 'j', '/', '⌫']} />
                                            <ShortcutItem label="Details" keys={['i']} />
                                            <ShortcutItem label="Similar" keys={['s']} />
                                        </div>
                                        <div className="flex flex-col space-y-3 w-full self-start">
                                            <ShortcutItem label="Chronology" keys={['c']} />
                                            <ShortcutItem label="Map" keys={['m']} />
                                            <ShortcutItem label="Show Media Stream" keys={['Esc']} />
                                            <ShortcutItem label="Show Help" keys={['H']} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between dark:text-gray-300 px-5 pt-4">
                                    <div className="text-lg font-medium self-center">Links</div>
                                </div>
                                <div className="flex flex-col md:flex-row w-full p-5 md:space-x-4 dark:text-gray-200">
                                    <div className="flex flex-col w-full sm:flex-row sm:justify-center sm:space-x-6">
                                        <div className="flex flex-col space-y-3 w-full self-start">
                                            <div className="w-full flex justify-between items-center">
                                                <div className="text-sm">
                                                    <a className="rounded hover:bg-gray-700 hover:cursor-pointer" href="https://docs.home-gallery.org/">
                                                        Documentation
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};