/**
 * @NApiVersion 2.x
 */
define([
        'N/format', 'N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/task', 'N/ui/serverWidget', 'N/translation', 'N/file'
    ],

    function (
        format, record, redirect, runtime, search, task, serverWidget, translation, file,
        _,
    ) {

        function getPageParameters(context, PAGE) {
            const pageParameters = {};
            if (context.request) {
                if (context.request.parameters) {
                    log.audit('parameters', context.request.parameters);
                    for (let i = 0; i < PAGE.FILTERS.length; i++) {
                        const p = PAGE.FILTERS[i].id;
                        if (!!PAGE.FILTERS[i].defaultValue) {
                            pageParameters[p] = PAGE.FILTERS[i].defaultValue;
                        } else if (context.request.parameters.hasOwnProperty(PAGE.FILTERS[i].id + '2')) {
                            pageParameters[p] = context.request.parameters[PAGE.FILTERS[i].id + '2'];
                        } else if (context.request.parameters.hasOwnProperty(PAGE.FILTERS[i].id)) {
                            pageParameters[p] = context.request.parameters[PAGE.FILTERS[i].id];
                        } else {
                            pageParameters[p] = null;
                        }
                        if (PAGE.FILTERS[i].issubsidiary) {
                            pageParameters['subsidiary'] = pageParameters[p];
                        }
                    }
                    pageParameters.result = context.request.parameters.result;
                    
                }
            }
            return pageParameters;
        }

        function writePage(context, PAGE, handlePost) {
            log.debug('writePage', context)
            try {
                var isPost = context.request.method == "POST";
                let i;
                // const IS_ONE_WORLD = runtime.isFeatureInEffect({
                //     feature: 'SUBSIDIARIES'
                // });
                var currentUser = runtime.getCurrentUser();
                var pageParameters = getPageParameters(context, PAGE);
                log.debug('pageParameters', pageParameters)

                pageParameters.subsidiary = pageParameters.subsidiary || currentUser.subsidiary;
                pageParameters.userId = currentUser.id
                log.debug('pageParameters2', pageParameters)

                if (!pageParameters.result) {

                    var form = serverWidget.createForm({
                        title: translation.get({
                            collection: PAGE.collection,
                            key: PAGE.TITLE
                        })()
                    });


               

                    if (!!PAGE.CLIENT_SCRIPT) {
                        form.clientScriptModulePath = PAGE.CLIENT_SCRIPT
                    }

                    var pField = form.addField({
                        id: 'custpage_page',
                        label: 'page',
                        type: 'longtext',
                    });
                    pField.updateDisplayType({   displayType: serverWidget.FieldDisplayType.HIDDEN});
                    pField.defaultValue = JSON.stringify(PAGE);
                    

                    if (PAGE.GROUP) {
                        for (i = 0; i < PAGE.GROUP.length; i++) {
                            if (PAGE.GROUP[i].labelkey) {
                                PAGE.GROUP[i].label = translation.get({
                                    collection: PAGE.collection,
                                    key: PAGE.GROUP[i].labelkey
                                })()
                            }
                            form.addFieldGroup(
                                PAGE.GROUP[i]
                            );
                        }
                    }

                    if (PAGE.SUBTABS) {
                        for (i = 0; i < PAGE.SUBTABS.length; i++) {
                            if (PAGE.SUBTABS[i].labelkey) {
                                PAGE.SUBTABS[i].label = translation.get({
                                    collection: PAGE.collection,
                                    key: PAGE.SUBTABS[i].labelkey
                                })()
                            }
                            form.addSubtab(
                                PAGE.SUBTABS[i]
                            );
                        }
                    }

                    for (i = 0; i < PAGE.FILTERS.length; i++) {
                        if (PAGE.FILTERS[i].labelkey) {
                            PAGE.FILTERS[i].label = translation.get({
                                collection: PAGE.collection,
                                key: PAGE.FILTERS[i].labelkey
                            })()
                        }
                        var fieldCrSubs = form.addField(
                            PAGE.FILTERS[i]
                        );
                        if (PAGE.FILTERS[i].displayType) {
                            fieldCrSubs.updateDisplayType({
                                displayType: PAGE.FILTERS[i].displayType
                            });
                        }
                        if (!!PAGE.FILTERS[i].mandatory) fieldCrSubs.isMandatory = true;
                        if (PAGE.FILTERS[i].defaultValue) {
                            fieldCrSubs.defaultValue = PAGE.FILTERS[i].defaultValue;
                        } else {
                            fieldCrSubs.defaultValue = pageParameters[PAGE.FILTERS[i].id];
                        }
                        if (PAGE.FILTERS[i].values) {
                            if (!PAGE.FILTERS[i].mandatory) {
                            fieldCrSubs.addSelectOption({
                                value: "",
                                text: ""
                            });
                        }
                            for (let k in PAGE.FILTERS[i].values) {
                                fieldCrSubs.addSelectOption({
                                    value: k,
                                    text: PAGE.FILTERS[i].values[k]
                                });
                            }
                        }
                    }
                    if (PAGE.HTML_TABLE) {
                        form.addField(PAGE.HTML_TABLE);
                    }




                    if (isPost) {
                        form.getField({
                            id: PAGE.HTML_TABLE.id
                        }).defaultValue = handlePost(pageParameters, PAGE);

                    } else {
                        form.getField({
                            id: PAGE.HTML_TABLE.id
                        }).defaultValue = '...';
                    }
                    // form.addSubmitButton({
                    //     label: translation.get({
                    //         collection: PAGE.collection,
                    //         key: 'SUBMIT'
                    //     })()
                    // });
                    form.addButton({
                        id: 'custbutton_render',
                        label: translation.get({
                                    collection: PAGE.collection,
                                    key: 'SUBMIT'
                                })(),
                        functionName: 'renderTable'
                    });
                    form.addResetButton({
                        label: 'Reset'
                    });
                    context.response.writePage(form);
                } else if (pageParameters.result.match('html')) {
                    var page = handlePost(pageParameters, PAGE);
                    context.response.write({output:page});

                }
            } catch (e) {
                log.error({
                    title: e.code,
                    details: e
                })
            }
        }

       

        return {
            writePage
        }

    });