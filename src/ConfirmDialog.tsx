import { Button, Divider, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Switch, useDisclosure } from '@nextui-org/react';
import React, { useEffect } from 'react';

interface ConfirmDialogProps {
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    open?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    title,
    message,
    onConfirm = () => { },
    onCancel = () => { },
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    open = false
}) => {

    const [isOpen, setIsOpen] = React.useState(open);
    const [confirmDisabled, setConfirmDisabled] = React.useState(true);
    useEffect(() => {
        if (open) {
            setConfirmDisabled(true);
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [open]);

    return (
        <Modal className='dark text-foreground' isOpen={isOpen}>
            <ModalContent>
                <ModalHeader>{title}</ModalHeader>
                <ModalBody>
                    <p>
                        {message}
                    </p>
                    <br />
                    <div>
                        <Switch className='float-right' defaultSelected={false} onValueChange={val => {setConfirmDisabled(!val)}}>I understand the risks.</Switch>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="warning" onClick={onConfirm} disabled={confirmDisabled}>{confirmText}</Button>
                    <Button color="danger" variant="light" onClick={onCancel}>{cancelText}</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ConfirmDialog;
