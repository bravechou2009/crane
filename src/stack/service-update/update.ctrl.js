(function () {
    'use strict';
    angular.module('app.stack')
        .controller('ServiceUpdateCtrl', ServiceUpdateCtrl);

    /* @ngInject */
    function ServiceUpdateCtrl($state, stackCurd, $stateParams, networkBackend, $scope, service) {
        var self = this;

        self.serviceLabelLength = 0;

        self.modeChange = modeChange;
        self.addConfig = addConfig;
        self.deleteConfig = deleteConfig;
        self.listServeLabel = listServeLabel;
        self.listContainerLabel = listContainerLabel;
        self.listConstraints = listConstraints;
        self.listEnv = listEnv;
        self.initSelectNetworks = initSelectNetworks;
        self.create = create;

        activate();

        function activate() {
            ///
            self.form = formatServeToForm(service);
            loadNetworks()
        }

        function formatServeToForm(service) {
            var form = service.Spec;
            form.formLabels = [];
            form.formContainerLabels = [];
            form.formPorts = [];
            form.formMounts = [];
            form.formConstraints = [];
            form.formEnv = [];
            form.formCmd = [];
            form.defaultMode = 'Global';

            angular.forEach(form.Labels, function (value, key) {
                var obj = {
                    key: key,
                    value: value
                };

                form.formLabels.push(obj)
            });

            angular.forEach(form.TaskTemplate.ContainerSpec.Labels, function (value, key) {
                var obj = {
                    key: key,
                    value: value
                };

                form.formContainerLabels.push(obj)
            });

            if (form.EndpointSpec.Ports) {
                form.formPorts = form.EndpointSpec.Ports
            }

            if (form.TaskTemplate.ContainerSpec.Mounts) {
                form.formMounts = form.TaskTemplate.ContainerSpec.Mounts
            }

            if (form.TaskTemplate.ContainerSpec.Command) {
                angular.forEach(form.TaskTemplate.ContainerSpec.Command, function (item, index) {
                    var obj = {
                        command: item
                    };

                    form.formCmd.push(obj)
                });
            }

            if (form.TaskTemplate.Placement.Constraints) {
                angular.forEach(form.TaskTemplate.Placement.Constraints, function (item, index) {
                    var obj = {
                        key: item.split('=')[0],
                        value: item.split('=')[1]
                    };

                    form.formConstraints.push(obj)
                });
            }

            if (form.TaskTemplate.ContainerSpec.Env) {
                angular.forEach(form.TaskTemplate.ContainerSpec.Env, function (item, index) {
                    var obj = {
                        key: item.split('=')[0],
                        value: item.split('=')[1]
                    };

                    form.formEnv.push(obj)
                });
            }

            form.defaultMode = Object.keys(form.Mode)[0];
            self.serviceLabelLength = form.formLabels.length;

            return form
        }

        function formatFormToJson() {
            var form = angular.copy(self.form);

            form.TaskTemplate.ContainerSpec.Env = [];
            form.TaskTemplate.Placement.Constraints = [];
            form.Labels = {};
            form.TaskTemplate.ContainerSpec.Labels = {};
            form.TaskTemplate.ContainerSpec.Command = [];
            form.TaskTemplate.ContainerSpec.Mounts = [];
            form.EndpointSpec.Ports = [];

            if (form.formEnv.length) {
                angular.forEach(self.form.formEnv, function (env, index, array) {
                    form.TaskTemplate.ContainerSpec.Env[index] = env.key + '=' + env.value
                });
            }

            if (form.formConstraints.length) {
                angular.forEach(form.formConstraints, function (constraint, index, array) {
                    form.TaskTemplate.Placement.Constraints[index] = constraint.key + '=' + constraint.value
                });
            }

            if (form.formLabels.length) {
                angular.forEach(form.formLabels, function (label, index, array) {
                    form.Labels[label.key] = label.value
                });
            }

            if (form.formContainerLabels.length) {
                angular.forEach(form.formContainerLabels, function (label, index, array) {
                    form.TaskTemplate.ContainerSpec.Labels[label.key] = label.value
                });
            }

            if (form.formCmd.length) {
                angular.forEach(form.formCmd, function (cmd, index, array) {
                    form.TaskTemplate.ContainerSpec.Command[index] = cmd.command
                });
            }

            form.TaskTemplate.ContainerSpec.Mounts = form.formMounts;
            form.Networks = service.Spec.Networks;
            form.EndpointSpec.Ports = form.formPorts;

            delete form.formEnv;
            delete form.formConstraints;
            delete form.formLabels;
            delete form.formContainerLabels;
            delete form.formCmd;
            delete form.formPorts;
            delete form.formNetworks;
            delete form.formMounts;
            delete form.defaultMode;

            return form
        }

        function loadNetworks() {
            networkBackend.listNetwork()
                .then(function (data) {
                    self.networks = data;
                })
        }

        function initSelectNetworks(id) {
            if (service.Spec.Networks && service.Spec.Networks.length) {

                var selectNetworks = [];
                angular.forEach(service.Spec.Networks, function (item, index) {
                    selectNetworks.push(item.Target)
                });
                return selectNetworks.includes(id) ? true : false;
            }
        }

        function modeChange() {
            if (self.form.defaultMode === 'Replicated') {
                self.form.Mode = {
                    Replicated: {
                        Replicas: ""
                    }
                }
            } else {
                self.form.Mode = {
                    Global: {}
                }
            }
        }

        function addConfig(configs, typeName) {

            var configTemplate = {
                Env: {
                    key: '',
                    value: ''
                },
                Constraints: {
                    key: '',
                    value: ''
                },
                ServeLabels: {
                    key: '',
                    value: ''
                },
                Labels: {
                    key: '',
                    value: ''
                },
                Ports: {
                    Name: '',
                    Protocol: 'tcp',
                    TargetPort: '',
                    PublishedPort: ''
                },
                Mounts: {
                    Source: '',
                    Target: '',
                    ReadOnly: true
                },
                Cmd: {
                    command: ''
                }
            };

            configs.push(configTemplate[typeName]);
        }

        function deleteConfig(index, configs) {
            configs.splice(index, 1);
        }

        function listServeLabel(curIndex) {
            var serveLabel = self.form.formLabels.map(function (item, index) {
                if (item.key && index != curIndex) {
                    return item.key
                }
            });

            return serveLabel
        }

        function listContainerLabel(curIndex) {
            var containerLabel = self.form.formContainerLabels.map(function (item, index) {
                if (item.key && index != curIndex) {
                    return item.key
                }
            });

            return containerLabel
        }

        function listConstraints(curIndex) {
            var constraints = self.form.formConstraints.map(function (item, index) {
                if (item.key && index != curIndex) {
                    return item.key
                }
            });

            return constraints
        }

        function listEnv(curIndex) {
            var env = self.form.formEnv.map(function (item, index) {
                if (item.key && index != curIndex) {
                    return item.key
                }
            });

            return env
        }

        function create() {
            var json = formatFormToJson();
            stackCurd.updateService(json, $scope.staticForm, $stateParams.stack_name, $stateParams.service_id)
        }


    }
})();