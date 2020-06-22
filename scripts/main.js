var App = (function($) {
    'use strict';

    var self = {};

    /*****************************************************************************
    References
    *****************************************************************************/
    /*
        p = principal
        r = rate
        c = contribution
        y = years
    */

    /*****************************************************************************
    Calculate
    *****************************************************************************/
    self.calculate = function(p, r, c, y) {
        var p = Number(p),
            r = Number(r),
            c = Number(c),
            y = Number(y),
            finalBalance,
            totalContribution,
            totalReturn;

        if (r) {
            r = r/100;
            finalBalance = p * Math.pow(1 + r, y) + c * ( (Math.pow(1 + r, y) - 1) / r );
            totalContribution = c * y;
            totalReturn = finalBalance - p - totalContribution;
        } else {
            totalContribution = c * y;
            finalBalance = p + totalContribution;
            totalReturn = finalBalance - p - totalContribution;
        }

        return {
            'principal' : p,
            'finalBalance' : finalBalance,
            'totalContribution' : totalContribution,
            'totalReturn' : totalReturn,
            'principalFormatted' : self.formatValue(p, '$'),
            'finalBalanceFormatted' : self.formatValue(finalBalance, '$'),
            'totalContributionFormatted' : self.formatValue(totalContribution, '$'),
            'totalReturnFormatted' : self.formatValue(totalReturn, '$')
        }
    }

    /*****************************************************************************
    Format Value to 2 decimal points
    *****************************************************************************/
    self.formatValue = function(value, type) {
        var formatted = parseFloat(Math.round(value * 100) / 100).toFixed(2);

        switch (type) {
            case '$':
                var x = formatted.split('.'),
                    x1 = x[0],
                    x2 = x.length > 1 ? '.' + x[1] : '',
                    rgx = /(\d+)(\d{3})/;

                // Add comma
                while (rgx.test(x1)) { x1 = x1.replace(rgx, '$1' + ',' + '$2') }

                return '$' + x1 + x2;
                break;
            case '%':
                return formatted + '%';
                break;
            default:
                return formatted
                break;
        }
    }

    /*****************************************************************************
    Get Ration
    *****************************************************************************/
    self.getRatio = function(value, max) {
        return 100 * (value/max)
    }

    /*****************************************************************************
    View Model
    *****************************************************************************/
    self.ViewModel = function() {
        var vm = this;

        // From Input
        vm.inputPrincipal = ko.observable(5000);
        vm.inputRate = ko.observable(3);
        vm.inputContribution = ko.observable(1000);
        vm.inputYears = ko.observable(30);

        // For Input Display
        vm.inputPrincipalFormatted = ko.computed(function() {
            return self.formatValue(vm.inputPrincipal(), '$');
        });
        vm.inputRateFormatted = ko.computed(function() {
            return self.formatValue(vm.inputRate(), '%');
        });
        vm.inputContributionFormatted = ko.computed(function() {
            return self.formatValue(vm.inputContribution(), '$');
        });
        vm.inputYearsFormatted = ko.computed(function() {
            return vm.inputYears() + ' years';
        });

        // For Display
        vm.principal = ko.computed(function() {
            return self.formatValue(vm.inputPrincipal(), '$');
        });
        vm.finalBalance = ko.observable('--');
        vm.totalContribution = ko.observable('--');
        vm.totalReturn = ko.observable('--');
        vm.answer = ko.observable('--');

        // For Chart
        vm.chartPrincipal = ko.observable(),
        vm.chartTotalContribution = ko.observable(),
        vm.chartTotalReturn = ko.observable();

        // For Mouse
        vm.isMouseDown = ko.observable(false);

        vm.getResults = function() {
            var answer = self.calculate(
                    vm.inputPrincipal(),
                    vm.inputRate(),
                    vm.inputContribution(), 
                    vm.inputYears()
                );

            // Show Results
            vm.showResults();

            // Update answer object
            vm.answer(answer);

            // Render chart
            vm.renderChart(this.answer());

            // Show result values
            vm.finalBalance(answer.finalBalanceFormatted);
            vm.totalContribution(answer.totalContributionFormatted);
            vm.totalReturn(answer.totalReturnFormatted);

        }

        vm.showResults = function() {
            $('.results-default').hide();
            $('.results').css('opacity','1');
        }

        vm.renderChart = function(data) {
            vm.chartPrincipal(self.getRatio(data.principal, data.finalBalance)+'%');
            vm.chartTotalContribution(self.getRatio(data.totalContribution, data.finalBalance)+'%');
            vm.chartTotalReturn(self.getRatio(data.totalReturn, data.finalBalance)+'%');
        }

        vm.focusBlur = function(data, event) {
            var $input = $(event.target).parents('.form-group');
            if (event.type==='focus') {
                $input.not('.active').addClass('active').siblings('.form-group').removeClass('active');
            }
        }

        vm.increase = function(data, event) {
            var $input = $(event.target).parents('.form-group').find('.form-control[type="number"]'),
                value = $input.val();

            $input.not(':focus').trigger('focus');

            switch ($input.attr('id')) {
                case 'rate':
                    value = value * 1 + 0.25;
                    break;
                case 'principal':
                case 'contribution':
                    value = value * 1 + 1000;
                    break;
                case 'years':
                    value = value * 1 + 1;
                    break;
            }

            return $input.val(value).trigger('change');
        }

        vm.decrease = function(data, event) {
            var $input = $(event.target).parents('.form-group').find('.form-control[type="number"]'),
                value = $input.val();

            $input.not(':focus').trigger('focus');

            if (value <= 0) {
                return value = 0;
            }

            switch ($input.attr('id')) {
                case 'rate':
                    value = value * 1 - 0.25;
                    break;
                case 'principal':
                case 'contribution':
                    value = value * 1 - 1000;
                    break;
                case 'years':
                    value = value * 1 - 1;
                    break;
            }

            $input.val(value).trigger('change');
        }

        vm.validate = function(data, e) {
            var charValue = String.fromCharCode(e.keyCode),
                valid = /^[0-9]+$/.test(charValue);

            // Trigger Submit
            if (event.charCode === 13) {
                $(event.target).parents('form').trigger('submit');
            }

            // Allow: backspace, delete, tab, escape, enter, ctrl+A and .
            if ($.inArray(e.keyCode, [46, 8, 9, 13, 27, 110, 190]) !== -1 ||
                // Allow: Ctrl+A
                (e.keyCode == 65 && e.ctrlKey === true) || 
                // Allow: home, end, left, right
                (e.keyCode >= 35 && e.keyCode <= 39)) {
                    // let it happen, don't do anything
                    return true;
            }

            // If not valid prevent default
            if (!valid) {
                e.preventDefault();
            }

            return true;
        }
    }

    return self;

})(jQuery);

ko.applyBindings(new App.ViewModel());

var isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
if (isSafari) {
    $('#principal').focus();
}